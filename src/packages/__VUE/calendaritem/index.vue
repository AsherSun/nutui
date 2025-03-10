<template>
  <view
    class="nut-calendar nut-calendar-taro"
    :class="{
      'nut-calendar-tile': !poppable,
      'nut-calendar-nofooter': isAutoBackFill
    }"
  >
    <!-- header -->
    <view class="nut-calendar-header" :class="{ 'nut-calendar-header-tile': !poppable }">
      <view class="calendar-title" v-if="showTitle">{{ title }}</view>
      <view class="calendar-top-slot" v-if="showTopBtn">
        <slot name="btn"> </slot>
      </view>
      <view class="calendar-curr-month" v-if="showSubTitle">{{ yearMonthTitle }}</view>
      <view class="calendar-weeks" ref="weeksPanel">
        <view class="calendar-week-item" v-for="(item, index) of weeks" :key="index">{{ item }}</view>
      </view>
    </view>
    <!-- content-->
    <view class="nut-calendar-content" ref="months" @scroll="mothsViewScroll">
      <view class="calendar-months-panel" ref="monthsPanel">
        <view class="viewArea" ref="viewArea" :style="{ transform: `translateY(${translateY}px)` }">
          <view class="calendar-month" v-for="(month, index) of compConthsData" :key="index">
            <view class="calendar-month-title">{{ month.title }}</view>
            <view class="calendar-month-con">
              <view class="calendar-month-item" :class="type === 'range' ? 'month-item-range' : ''">
                <template v-for="(day, i) of month.monthData" :key="i">
                  <view class="calendar-month-day" :class="getClass(day, month)" @click="chooseDay(day, month)">
                    <!-- 日期显示slot -->
                    <view class="calendar-day">
                      <slot name="day" :date="day.type == 'curr' ? day : ''">
                        {{ day.type == 'curr' ? day.day : '' }}
                      </slot>
                    </view>
                    <view class="calendar-curr-tips calendar-curr-tips-top" v-if="topInfo">
                      <slot name="topInfo" :date="day.type == 'curr' ? day : ''"> </slot>
                    </view>
                    <view class="calendar-curr-tips calendar-curr-tips-bottom" v-if="bottomInfo">
                      <slot name="bottomInfo" :date="day.type == 'curr' ? day : ''"> </slot>
                    </view>
                    <view class="calendar-curr-tip-curr" v-if="!bottomInfo && showToday && isCurrDay(day)"> 今天 </view>
                    <view
                      class="calendar-day-tip"
                      :class="{ 'calendar-curr-tips-top': rangeTip(day, month) }"
                      v-if="isStartTip(day, month)"
                    >
                      {{ startText }}
                    </view>
                    <view class="calendar-day-tip" v-if="isEndTip(day, month)">{{ endText }}</view>
                  </view>
                </template>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
    <!-- footer-->
    <view class="nut-calendar-footer" v-if="poppable && !isAutoBackFill">
      <view class="calendar-confirm-btn" @click="confirm">{{ confirmText }}</view>
    </view>
  </view>
</template>
<script lang="ts">
import { PropType, reactive, ref, watch, toRefs, computed } from 'vue';
import { createComponent } from '../../utils/create';
const { create } = createComponent('calendar-item');
import Utils from '../../utils/date';
import requestAniFrame from '../../utils/raf';
type InputDate = string | string[];
interface CalendarState {
  yearMonthTitle: string;
  currDate: any;
  propStartDate: string;
  propEndDate: string;
  currentIndex: number;
  unLoadPrev: boolean;
  touchParams: any;
  transformY: number;
  translateY: number;
  scrollDistance: number;
  defaultData: InputDate;
  chooseData: any;
  monthsData: any[];
  dayPrefix: string;
  startData: InputDate;
  endData: InputDate;
  isRange: boolean;
  timer: number;
  avgHeight: number;
  monthsNum: number;
  defaultRange: any[];
}
interface Day {
  day: string | number;
  type: string;
}

interface MonthInfo {
  curData: string[] | string;
  title: string;
  monthData: Day[];
  cssHeight?: Number;
  cssScrollHeight?: Number;
}

export default create({
  props: {
    type: {
      type: String,
      default: 'one'
    },
    isAutoBackFill: {
      type: Boolean,
      default: false
    },
    poppable: {
      type: Boolean,
      default: true
    },
    showTitle: {
      type: Boolean,
      default: true
    },
    showSubTitle: {
      type: Boolean,
      default: true
    },
    showToday: {
      type: Boolean,
      default: true
    },
    title: {
      type: String,
      default: '日历选择'
    },
    confirmText: {
      type: String,
      default: '确认'
    },
    startText: {
      type: String,
      default: '开始'
    },
    endText: {
      type: String,
      default: '结束'
    },
    defaultValue: {
      type: [String, Array],
      default: null
    },
    startDate: {
      type: String,
      default: Utils.getDay(0)
    },
    endDate: {
      type: String,
      default: Utils.getDay(365)
    }
  },
  emits: ['choose', 'update', 'close', 'select'],

  setup(props, { emit, slots }) {
    const weeks = ref(['日', '一', '二', '三', '四', '五', '六']);
    // element refs
    const months = ref<null | HTMLElement>(null);
    const monthsPanel = ref<null | HTMLElement>(null);
    const weeksPanel = ref<null | HTMLElement>(null);
    const viewArea = ref<null | HTMLElement>(null);
    const viewHeight = ref(0);
    const compConthsData = computed(() => {
      return state.monthsData.slice(state.defaultRange[0], state.defaultRange[1]);
    });
    const showTopBtn = computed(() => {
      return slots.btn;
    });
    const topInfo = computed(() => {
      return slots.topInfo;
    });
    const bottomInfo = computed(() => {
      return slots.bottomInfo;
    });

    const state: CalendarState = reactive({
      yearMonthTitle: '',
      defaultRange: [],
      currDate: '',
      propStartDate: '',
      propEndDate: '',
      unLoadPrev: false,
      touchParams: {
        startY: 0,
        endY: 0,
        startTime: 0,
        endTime: 0,
        lastY: 0,
        lastTime: 0
      },
      transformY: 0,
      translateY: 0,
      scrollDistance: 0,
      defaultData: [],
      chooseData: [],
      monthsData: [],
      dayPrefix: 'calendar-month-day',
      startData: '',
      endData: '',
      isRange: props.type === 'range',
      timer: 0,
      currentIndex: 0,
      avgHeight: 0,
      monthsNum: 0
    });
    // 日期转化成数组
    const splitDate = (date: string) => {
      return date.split('-');
    };
    // 判断是否为开始时间
    const isStart = (currDate: string) => {
      return Utils.isEqual(state.currDate[0], currDate);
    };
    // 判断是否为结束时间
    const isEnd = (currDate: string) => {
      return Utils.isEqual(state.currDate[1], currDate);
    };

    // 获取当前数据
    const getCurrDate = (day: Day, month: MonthInfo, isRange?: boolean) => {
      return month.curData[0] + '-' + month.curData[1] + '-' + Utils.getNumTwoBit(+day.day);
    };

    // 获取样式
    const getClass = (day: Day, month: MonthInfo, isRange?: boolean) => {
      const currDate = getCurrDate(day, month, isRange);
      if (day.type == 'curr') {
        if (
          (!state.isRange && Utils.isEqual(state.currDate as string, currDate)) ||
          (state.isRange && (isStart(currDate) || isEnd(currDate)))
        ) {
          return `${state.dayPrefix}-active`;
        } else if (
          (state.propStartDate && Utils.compareDate(currDate, state.propStartDate)) ||
          (state.propEndDate && Utils.compareDate(state.propEndDate, currDate))
        ) {
          return `${state.dayPrefix}-disabled`;
        } else if (
          state.isRange &&
          Array.isArray(state.currDate) &&
          Object.values(state.currDate).length == 2 &&
          Utils.compareDate(state.currDate[0], currDate) &&
          Utils.compareDate(currDate, state.currDate[1])
        ) {
          return `${state.dayPrefix}-choose`;
        } else {
          return null;
        }
      } else {
        return `${state.dayPrefix}-disabled`;
      }
    };
    // 确认选择时触发
    const confirm = () => {
      if ((state.isRange && state.chooseData.length == 2) || !state.isRange) {
        emit('choose', state.chooseData);
        if (props.poppable) {
          emit('update');
        }
      }
    };

    // 选中数据
    const chooseDay = (day: Day, month: MonthInfo, isFirst: boolean, isRange?: boolean) => {
      if (getClass(day, month, isRange) != `${state.dayPrefix}-disabled`) {
        let days = [...month.curData];
        days[2] = typeof day.day == 'number' ? Utils.getNumTwoBit(day.day) : day.day;
        days[3] = `${days[0]}-${days[1]}-${days[2]}`;
        days[4] = Utils.getWhatDay(+days[0], +days[1], +days[2]);
        if (!state.isRange) {
          state.currDate = days[3];
          state.chooseData = [...days];
        } else {
          if (Object.values(state.currDate).length == 2) {
            state.currDate = [days[3]];
          } else {
            if (Utils.compareDate(state.currDate[0], days[3])) {
              Array.isArray(state.currDate) && state.currDate.push(days[3]);
            } else {
              Array.isArray(state.currDate) && state.currDate.unshift(days[3]);
            }
          }
          if (state.chooseData.length == 2 || !state.chooseData.length) {
            state.chooseData = [...days];
          } else {
            if (Utils.compareDate(state.chooseData[3], days[3])) {
              state.chooseData = [[...state.chooseData], [...days]];
            } else {
              state.chooseData = [[...days], [...state.chooseData]];
            }
          }
        }
        if (!isFirst) {
          // 点击日期 触发
          emit('select', state.chooseData);
          if (props.isAutoBackFill) {
            confirm();
          }
        }
      }
    };

    // 获取当前月数据
    const getCurrData = (type: string) => {
      const monthData = type == 'prev' ? state.monthsData[0] : state.monthsData[state.monthsData.length - 1];
      let year = parseInt(monthData.curData[0]);
      let month = parseInt(monthData.curData[1].toString().replace(/^0/, ''));
      switch (type) {
        case 'prev':
          month == 1 && (year -= 1);
          month = month == 1 ? 12 : --month;
          break;
        case 'next':
          month == 12 && (year += 1);
          month = month == 12 ? 1 : ++month;
          break;
      }
      return [year, Utils.getNumTwoBit(month), Utils.getMonthDays(String(year), String(month))];
    };

    // 获取日期状态
    const getDaysStatus = (days: number, type: string, dateInfo: any) => {
      // 修复：当某个月的1号是周日时，月份下方会空出来一行
      let { year, month } = dateInfo;
      if (type == 'prev' && days >= 7) {
        days -= 7;
      }
      return Array.from(Array(days), (v, k) => {
        return {
          day: k + 1,
          type: type,
          year,
          month
        };
      });
    };
    // 获取上一个月的最后一周天数，填充当月空白
    const getPreDaysStatus = (days: number, type: string, dateInfo: any, preCurrMonthDays: number) => {
      // 修复：当某个月的1号是周日时，月份下方会空出来一行
      let { year, month } = dateInfo;
      if (type == 'prev' && days >= 7) {
        days -= 7;
      }
      let months = Array.from(Array(preCurrMonthDays), (v, k) => {
        return {
          day: k + 1,
          type: type,
          year,
          month
        };
      });
      return months.slice(preCurrMonthDays - days);
    };
    // 获取月数据
    const getMonth = (curData: any[], type: string) => {
      // 一号为周几
      const preMonthDays = Utils.getMonthPreDay(+curData[0], +curData[1]);

      let preMonth = curData[1] - 1;
      let preYear = curData[0];
      if (preMonth <= 0) {
        preMonth = 12;
        preYear += 1;
      }
      //当月天数与上个月天数
      const currMonthDays = Utils.getMonthDays(curData[0], curData[1]);
      const preCurrMonthDays = Utils.getMonthDays(preYear + '', preMonth + '');

      const title = {
        year: curData[0],
        month: curData[1]
      };
      const monthInfo: MonthInfo = {
        curData: curData,
        title: `${title.year}年${title.month}月`,
        monthData: [
          ...(getPreDaysStatus(preMonthDays, 'prev', { month: preMonth, year: preYear }, preCurrMonthDays) as Day[]),
          ...(getDaysStatus(currMonthDays, 'curr', title) as Day[])
        ]
      };
      monthInfo.cssHeight = 39 + (monthInfo.monthData.length > 35 ? 384 : 320);
      let cssScrollHeight = 0;

      if (state.monthsData.length > 0) {
        cssScrollHeight =
          state.monthsData[state.monthsData.length - 1].cssScrollHeight +
          state.monthsData[state.monthsData.length - 1].cssHeight;
      }
      monthInfo.cssScrollHeight = cssScrollHeight;
      if (type == 'next') {
        // 判断当前日期 是否大于 最后一天
        if (
          !state.endData ||
          !Utils.compareDate(
            `${state.endData[0]}-${state.endData[1]}-${Utils.getMonthDays(state.endData[0], state.endData[1])}`,
            `${curData[0]}-${curData[1]}-${curData[2]}`
          )
        ) {
          state.monthsData.push(monthInfo);
        }
      } else {
        // 判断当前日期 是否小于 第一天
        if (
          !state.startData ||
          !Utils.compareDate(
            `${curData[0]}-${curData[1]}-${curData[2]}`,
            `${state.startData[0]}-${state.startData[1]}-01`
          )
        ) {
          state.monthsData.unshift(monthInfo);
        } else {
          state.unLoadPrev = true;
        }
      }
    };

    // 初始化数据
    const initData = () => {
      // 初始化开始结束数据
      let propStartDate = props.startDate ? props.startDate : Utils.getDay(0);
      let propEndDate = props.endDate ? props.endDate : Utils.getDay(365);
      state.propStartDate = propStartDate;
      state.propEndDate = propEndDate;
      state.startData = splitDate(propStartDate);
      state.endData = splitDate(propEndDate);

      // 根据是否存在默认时间，初始化当前日期,
      if (!props.defaultValue || (Array.isArray(props.defaultValue) && props.defaultValue.length <= 0)) {
        state.currDate = state.isRange ? [Utils.date2Str(new Date()), Utils.getDay(1)] : Utils.date2Str(new Date());
      } else {
        state.currDate = state.isRange ? [...props.defaultValue] : props.defaultValue;
      }

      // 判断时间范围内存在多少个月
      const startDate = {
        year: Number(state.startData[0]),
        month: Number(state.startData[1])
      };
      const endDate = {
        year: Number(state.endData[0]),
        month: Number(state.endData[1])
      };
      let monthsNum = endDate.month - startDate.month;
      if (endDate.year - startDate.year > 0) {
        monthsNum = monthsNum + 12 * (endDate.year - startDate.year);
      }

      // 设置月份数据
      getMonth(state.startData, 'next');

      let i = 1;
      do {
        getMonth(getCurrData('next'), 'next');
      } while (i++ < monthsNum);

      state.monthsNum = monthsNum;

      // 日期转化为数组，限制初始日期。判断时间范围
      if (state.isRange && Array.isArray(state.currDate)) {
        if (propStartDate && Utils.compareDate(state.currDate[0], propStartDate)) {
          state.currDate.splice(0, 1, propStartDate);
        }
        if (propEndDate && Utils.compareDate(propEndDate, state.currDate[1])) {
          state.currDate.splice(1, 1, propEndDate);
        }
        state.defaultData = [...splitDate(state.currDate[0]), ...splitDate(state.currDate[1])];
      } else {
        if (propStartDate && Utils.compareDate(state.currDate as string, propStartDate)) {
          state.currDate = propStartDate;
        } else if (propEndDate && !Utils.compareDate(state.currDate as string, propEndDate)) {
          state.currDate = propEndDate;
        }
        state.defaultData = [...splitDate(state.currDate as string)];
      }
      // 设置默认可见区域
      let current = 0;
      let lastCurrent = 0;
      state.monthsData.forEach((item, index) => {
        if (item.title == `${state.defaultData[0]}年${state.defaultData[1]}月`) {
          current = index;
        }
        if (state.isRange) {
          if (item.title == `${state.defaultData[3]}年${state.defaultData[4]}月`) {
            lastCurrent = index;
          }
        }
      });
      setDefaultRange(monthsNum, current);
      state.currentIndex = current;
      state.yearMonthTitle = state.monthsData[state.currentIndex].title;
      // 设置当前选中日期
      if (state.isRange) {
        chooseDay({ day: state.defaultData[2], type: 'curr' }, state.monthsData[state.currentIndex], true);
        chooseDay({ day: state.defaultData[5], type: 'curr' }, state.monthsData[lastCurrent], true, true);
      } else {
        chooseDay({ day: state.defaultData[2], type: 'curr' }, state.monthsData[state.currentIndex], true);
      }

      let lastItem = state.monthsData[state.monthsData.length - 1];
      let containerHeight = lastItem.cssHeight + lastItem.cssScrollHeight;
      requestAniFrame(() => {
        // 初始化 日历位置
        if (months?.value && monthsPanel?.value && viewArea?.value) {
          viewHeight.value = months.value.clientHeight;
          monthsPanel.value.style.height = `${containerHeight}px`;
          months.value.scrollTop = state.monthsData[state.currentIndex].cssScrollHeight;
        }
      });
      state.avgHeight = Math.floor(containerHeight / (monthsNum + 1));
    };
    // 设置当前可见月份
    const setDefaultRange = (monthsNum: number, current: number) => {
      if (monthsNum >= 3) {
        if (current > 0 && current < monthsNum) {
          state.defaultRange = [current - 1, current + 3];
        } else if (current == 0) {
          state.defaultRange = [current, current + 4];
        } else if (current == monthsNum) {
          state.defaultRange = [current - 2, current + 2];
        }
      } else {
        state.defaultRange = [0, monthsNum + 2];
      }
      let defaultScrollTop = state.monthsData[state.defaultRange[0]].cssScrollHeight;
      state.translateY = defaultScrollTop;
    };
    // 区间选择&&当前月&&选中态
    const isActive = (day: Day, month: MonthInfo) => {
      return state.isRange && day.type == 'curr' && getClass(day, month) == 'calendar-month-day-active';
    };

    // 是否有开始提示
    const isStartTip = (day: Day, month: MonthInfo) => {
      return isActive(day, month) && isStart(getCurrDate(day, month));
    };

    // 是否有结束提示
    const isEndTip = (day: Day, month: MonthInfo) => {
      if (state.currDate.length >= 2 && isEnd(getCurrDate(day, month))) {
        return isActive(day, month);
      }
      return false;
    };
    // 开始结束时间是否相等
    const rangeTip = (day: Day, month: MonthInfo) => {
      if (state.currDate.length >= 2) {
        return Utils.isEqual(state.currDate[0], state.currDate[1]);
      }
    };
    // 是否有 当前日期
    const isCurrDay = (dateInfo: any) => {
      const date = `${dateInfo.year}-${dateInfo.month}-${dateInfo.day < 10 ? '0' + dateInfo.day : dateInfo.day}`;
      return Utils.isEqual(date, Utils.date2Str(new Date()));
    };
    // 滚动处理事件
    const mothsViewScroll = (e: any) => {
      const currentScrollTop = e.target.scrollTop;
      let current = Math.floor(currentScrollTop / state.avgHeight);
      if (current == 0) {
        if (currentScrollTop >= state.monthsData[current + 1].cssScrollHeight) {
          current += 1;
        }
      } else if (current > 0 && current < state.monthsNum - 1) {
        if (currentScrollTop >= state.monthsData[current + 1].cssScrollHeight) {
          current += 1;
        }
        if (currentScrollTop < state.monthsData[current].cssScrollHeight) {
          current -= 1;
        }
      } else {
        const viewPosition = Math.round(currentScrollTop + viewHeight.value);
        if (
          viewPosition < state.monthsData[current].cssScrollHeight + state.monthsData[current].cssHeight &&
          currentScrollTop > state.monthsData[current - 1].cssScrollHeight
        ) {
          current -= 1;
        }
        if (
          current + 1 <= state.monthsNum &&
          viewPosition >= state.monthsData[current + 1].cssScrollHeight + state.monthsData[current + 1].cssHeight
        ) {
          current += 1;
        }
        if (currentScrollTop < state.monthsData[current - 1].cssScrollHeight) {
          current -= 1;
        }
      }

      if (state.currentIndex !== current) {
        state.currentIndex = current;
        setDefaultRange(state.monthsNum, current);
      }
      state.yearMonthTitle = state.monthsData[current].title;
    };

    // 重新渲染
    const resetRender = () => {
      state.chooseData.splice(0);
      state.monthsData.splice(0);
      initData();
    };

    // 初始化数据
    initData();

    // //监听 默认值更改
    watch(
      () => props.defaultValue,
      (val) => {
        if (val) {
          if (props.poppable) {
            resetRender();
          }
        }
      }
    );

    return {
      weeks,
      compConthsData,
      showTopBtn,
      topInfo,
      bottomInfo,
      rangeTip,
      mothsViewScroll,
      getClass,
      isStartTip,
      isEndTip,
      chooseDay,
      isCurrDay,
      confirm,
      monthsPanel,
      months,
      weeksPanel,
      viewArea,
      ...toRefs(state),
      ...toRefs(props)
    };
  }
});
</script>
