<template>
  <view :class="classes">
    <view v-if="leftIcon && leftIcon.length > 0" class="nut-input-left-icon" @click="onClickLeftIcon">
      <nut-icon :name="leftIcon" :size="leftIconSize"></nut-icon>
    </view>
    <view
      v-if="label"
      class="nut-input-label"
      :class="labelClass"
      :style="{
        width: `${labelWidth}px`,
        textAlign: labelAlign
      }"
    >
      <view class="label-string">
        {{ label }}
        {{ colon ? ':' : '' }}
      </view>
    </view>
    <view class="nut-input-value">
      <view class="nut-input-inner" @click="onClickInput">
        <textarea
          v-if="type == 'textarea'"
          class="input-text"
          ref="inputRef"
          :style="stylesTextarea"
          :maxlength="maxLength"
          :placeholder="placeholder"
          :disabled="disabled"
          :readonly="readonly"
          :value="modelValue"
          :formatTrigger="formatTrigger"
          :autofocus="autofocus"
          @input="onInput"
          @focus="onFocus"
          @blur="onBlur"
        />
        <input
          v-else
          class="input-text"
          ref="inputRef"
          :style="styles"
          :type="inputType(type)"
          :maxNum="maxNum"
          :placeholder="placeholder"
          :disabled="disabled"
          :readonly="readonly"
          :value="modelValue"
          :formatTrigger="formatTrigger"
          :autofocus="autofocus"
          @input="onInput"
          @focus="onFocus"
          @blur="onBlur"
        />
        <nut-icon
          class="nut-input-clear"
          v-if="clearable && !readonly"
          v-show="active && modelValue.length > 0"
          :name="clearIcon"
          :size="clearSize"
          @click="clear"
        >
        </nut-icon>
        <view v-if="rightIcon && rightIcon.length > 0" class="nut-input-right-icon" @click="onClickRightIcon">
          <nut-icon :name="rightIcon" :size="rightIconSize"></nut-icon>
        </view>
        <slot v-if="$slots.button" name="button" class="nut-input-button"></slot>
      </view>
      <view v-if="showWordLimit && maxNum" class="nut-input-word-limit">
        <span class="nut-input-word-num">{{ modelValue ? modelValue.length : 0 }}</span
        >/{{ maxNum }}
      </view>
      <view
        v-if="errorMessage"
        class="nut-input-error-message"
        :style="{
          textAlign: errorMessageAlign
        }"
      >
        {{ errorMessage }}
      </view>
    </view>
  </view>
</template>
<script lang="ts">
import { PropType, ref, reactive, computed, onMounted, watch, nextTick, inject } from 'vue';
import { createComponent } from '../../utils/create';
import { formatNumber } from './util';

const { componentName, create } = createComponent('input');
interface Events {
  eventName: 'focus' | 'blur' | 'clear' | 'change' | 'update:modelValue';
  params: (string | number | Event)[];
}
export type InputAlignType = 'left' | 'center' | 'right'; // text-align
export type InputFormatTrigger = 'onChange' | 'onBlur'; // onChange: 在输入时执行格式化 ; onBlur: 在失焦时执行格式化
export type InputType =
  | 'tel'
  | 'url'
  | 'date'
  | 'file'
  | 'text'
  | 'time'
  | 'week'
  | 'color'
  | 'digit'
  | 'email'
  | 'image'
  | 'month'
  | 'radio'
  | 'range'
  | 'reset'
  | 'button'
  | 'hidden'
  | 'number'
  | 'search'
  | 'submit'
  | 'checkbox'
  | 'password'
  | 'textarea'
  | 'datetime-local';

export type InputRule = {
  pattern?: RegExp;
  message?: string;
  required?: boolean;
  validator?: FieldRuleValidator; // 通过函数进行校验
};

export default create({
  props: {
    ref: {
      type: String,
      default: ''
    },
    type: {
      type: String as PropType<InputType>,
      default: 'text'
    },
    modelValue: {
      type: [String, Number],
      default: ''
    },
    placeholder: {
      type: String,
      default: '请输入信息'
    },
    label: {
      type: String,
      default: ''
    },
    labelClass: {
      type: String,
      default: ''
    },
    labelWidth: {
      type: [String, Number],
      default: '80'
    },
    labelAlign: {
      type: String as PropType<InputAlignType>,
      default: 'left'
    },
    colon: {
      type: Boolean,
      default: false
    },
    inputAlign: {
      type: String,
      default: 'left'
    },
    center: {
      type: Boolean,
      default: false
    },
    required: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    readonly: {
      type: Boolean,
      default: false
    },
    error: {
      type: Boolean,
      default: false
    },
    maxNum: {
      type: [String, Number],
      default: ''
    },
    leftIcon: {
      type: String,
      default: ''
    },
    leftIconSize: {
      type: [String, Number],
      default: ''
    },
    rightIcon: {
      type: String,
      default: ''
    },
    rightIconSize: {
      type: [String, Number],
      default: ''
    },
    clearable: {
      type: Boolean,
      default: false
    },
    clearIcon: {
      type: String,
      default: 'mask-close'
    },
    clearSize: {
      type: [String, Number],
      default: '14'
    },
    border: {
      type: Boolean,
      default: true
    },
    formatTrigger: {
      type: String as PropType<InputFormatTrigger>,
      default: 'onChange'
    },
    formatter: {
      type: Function as PropType<(value: string) => string>,
      default: null
    },
    rules: {
      type: Array as PropType<InputRule>,
      default: []
    },
    errorMessage: {
      type: String,
      default: ''
    },
    errorMessageAlign: {
      type: String as PropType<InputAlignType>,
      default: ''
    },
    rows: {
      type: [String, Number],
      default: null
    },
    showWordLimit: {
      type: Boolean,
      default: true
    },
    autofocus: {
      type: Boolean,
      default: false
    }
  },

  emits: [
    'update:modelValue',
    'change',
    'blur',
    'focus',
    'clear',
    'keypress',
    'click-input',
    'click-left-icon',
    'click-right-icon'
  ],

  setup(props, { emit, slots }) {
    const active = ref(false);

    const inputRef = ref<HTMLInputElement>();
    const customValue = ref<() => unknown>();
    const getModelValue = () => String(props.modelValue ?? '');
    const form = inject('form');

    const state = reactive({
      focused: false,
      validateFailed: false, // 校验失败
      validateMessage: '' // 校验信息
    });

    const classes = computed(() => {
      const prefixCls = componentName;
      return {
        [prefixCls]: true,
        center: props.center,
        [`${prefixCls}-disabled`]: props.disabled,
        [`${prefixCls}-required`]: props.required,
        [`${prefixCls}-error`]: props.error,
        [`${prefixCls}-border`]: props.border
      };
    });

    const styles = computed(() => {
      return {
        textAlign: props.inputAlign
      };
    });
    const stylesTextarea = computed(() => {
      return {
        textAlign: props.inputAlign,
        height: Number(props.rows) * 24 + 'px'
      };
    });

    const inputType = (type: string) => {
      if (type === 'number') {
        return 'text';
      } else if (type === 'digit') {
        return 'tel';
      } else {
        return type;
      }
    };

    const formValue = computed(() => {
      if (customValue.value && slots.input) {
        return customValue.value();
      }
      return props.modelValue;
    });

    // const inputmode = computed(() => {
    //   return props.type === 'digit' ? 'decimal' : props.type === 'number' ? 'numeric' : 'text';
    // });

    const onInput = (event: Event) => {
      const input = event.target as HTMLInputElement;
      let value = input.value;

      // if (!event.target!.composing) {
      //   updateValue((event.target as HTMLInputElement).value);
      // }
      updateValue(value);
    };

    const blur = () => inputRef.value?.blur();
    const focus = () => inputRef.value?.focus();

    const updateValue = (value: string, trigger: InputFormatTrigger = 'onChange') => {
      if (props.type === 'digit') {
        value = formatNumber(value, false, false);
      }
      if (props.type === 'number') {
        // console.log('value', value)
        value = formatNumber(value, true, true);
      }

      if (props.formatter && trigger === props.formatTrigger) {
        value = props.formatter(value);
      }

      // if (props.maxNum && value.length > Number(props.maxNum)) {
      //   value = value.slice(0, Number(props.maxNum));
      // }

      if (inputRef.value && inputRef.value.value !== value) {
        inputRef.value.value = value;
      }

      if (value !== props.modelValue) {
        emit('update:modelValue', value);
        emit('change', value);
      }
    };

    // const limitValueLength = (value: string) => {
    //   const { maxNum } = props;
    //   if (isDef(maxNum) && getStringLength(value) > maxNum) {
    //     const modelValue = getModelValue();
    //     if (modelValue && getStringLength(modelValue) === +maxNum) {
    //       return modelValue;
    //     }
    //     return cutString(value, +maxLength);
    //   }
    //   return value;
    // };

    const onFocus = (event: Event) => {
      const input = event.target as HTMLInputElement;
      let value = input.value;
      active.value = true;
      emit('focus', value, event);
      // if (getProp('readonly')) {
      //   blur();
      // }
    };

    const onBlur = (event: Event) => {
      setTimeout(() => {
        active.value = false;
      }, 200);

      // if (getProp('readonly')) {
      //   return;
      // }

      const input = event.target as HTMLInputElement;
      let value = input.value;
      if (props.maxNum && value.length > Number(props.maxNum)) {
        value = value.slice(0, Number(props.maxNum));
      }
      updateValue(getModelValue(), 'onBlur');
      emit('blur', value, event);
      validateWithTrigger('onBlur');
    };

    const clear = (event: Event) => {
      emit('update:modelValue', '', event);
      emit('change', '', event);
      emit('clear', '', event);
    };

    // const runRules = (rules: InputRule[]) =>
    //   rules.reduce(
    //     (promise, rule) =>
    //       promise.then(() => {
    //         console.log('promise', promise, 'rule', rule)
    //         if (state.validateFailed) {
    //           return;
    //         }

    //         let { value } = formValue;

    //         // if (rule.formatter) {
    //         //   value = rule.formatter(value, rule);
    //         // }

    //         if (!runSyncRule(value, rule)) {
    //           state.validateFailed = true;
    //           state.validateMessage = getRuleMessage(value, rule);
    //           return;
    //         }

    //         if (rule.validator) {
    //           return runRuleValidator(value, rule).then((result) => {
    //             if (result && typeof result === 'string') {
    //               state.validateFailed = true;
    //               state.validateMessage = result;
    //             } else if (result === false) {
    //               state.validateFailed = true;
    //               state.validateMessage = getRuleMessage(value, rule);
    //             }
    //           });
    //         }
    //       }),
    //     Promise.resolve()
    //   );

    const resetValidation = () => {
      if (state.validateFailed) {
        state.validateFailed = false;
        state.validateMessage = '';
      }
    };

    // const validate = (rules: any) =>
    //   new Promise<void>((resolve) => {
    //     console.log('rules122', form.props.rules)
    //     resetValidation();
    //     if (rules) {
    //       console.log('rules233', rules)
    //       runRules(rules).then(() => {
    //         if (state.validateFailed) {
    //           resolve({
    //             // name: rules,
    //             message: state.validateMessage
    //           });
    //         } else {
    //           resolve();
    //         }
    //       });
    //     } else {
    //       resolve();
    //     }
    //   });

    const validateWithTrigger = (trigger: InputFormatTrigger) => {
      if (form && form.props.rules) {
        const rules = form.props.rules;
        if (rules) {
          // console.log('rules', rules)
          // validate(rules);
        }
      }
    };

    const onClickInput = (event: MouseEvent) => {
      emit('click-input', event);
    };

    const onClickLeftIcon = (event: MouseEvent) => emit('click-left-icon', event);

    const onClickRightIcon = (event: MouseEvent) => emit('click-right-icon', event);

    watch(
      () => props.modelValue,
      () => {
        updateValue(getModelValue());
        resetValidation();
        validateWithTrigger('onChange');
      }
    );

    onMounted(() => {
      updateValue(getModelValue(), props.formatTrigger);
    });

    return {
      inputRef,
      active,
      classes,
      styles,
      stylesTextarea,
      inputType,
      // inputmode,
      onInput,
      onFocus,
      onBlur,
      clear,
      onClickInput,
      onClickLeftIcon,
      onClickRightIcon
    };
  }
});
</script>
