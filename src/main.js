// vue, axio, vue-axios外部套件要先導入
import Vue from 'vue';
import axios from 'axios';
import VueAxios from 'vue-axios';

// 外部套件先導入完，才是內部套件程式的導入，import順序為1.外部套件 2.內部套件
import App from './App.vue';

Vue.config.productionTip = false;
// 需加上這段程式，使用Vue來加上VueAxio, axio這兩個外部套件，Vue為預設加入的外部套件
Vue.use(VueAxios, axios);

new Vue({
  render: (h) => h(App),
}).$mount('#app');
