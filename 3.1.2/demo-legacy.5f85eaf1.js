System.register(["./mobile-legacy.f33f830d.js","./vendor-legacy.87645186.js","./index-legacy.ff8a60d7.js"],(function(t){"use strict";var n,e,s,i,o,c;return{setters:[function(t){n=t.c,e=t.T},function(t){s=t.r,i=t.o,o=t.c,c=t.f},function(){}],execute:function(){const{createDemo:l}=n("toast"),a=t("default",l({setup:()=>({textToast:t=>{e.text(t)},successToast:t=>{e.success(t)},errorToast:t=>{e.fail(t)},warningToast:t=>{e.warn(t)},loadingToast:t=>{e.loading(t)}})})),r={class:"demo"},u=c("h2",null,"基本用法",-1);a.render=function(t,n,e,l,a,f){const d=s("nut-cell");return i(),o("div",r,[u,c(d,{title:"Text 文字提示","is-link":"",onClick:n[1]||(n[1]=n=>t.textToast("网络失败，请稍后再试~"))}),c(d,{title:"Success 成功提示","is-link":"",onClick:n[2]||(n[2]=n=>t.successToast("成功提示"))}),c(d,{title:"Error 失败提示","is-link":"",onClick:n[3]||(n[3]=n=>t.errorToast("失败提示"))}),c(d,{title:"Warning 警告提示","is-link":"",onClick:n[4]||(n[4]=n=>t.warningToast("警告提示"))}),c(d,{title:"Loading 加载提示","is-link":"",onClick:n[5]||(n[5]=n=>t.loadingToast("加载中"))})])}}}}));
