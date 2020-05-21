<template>
  <div id="app">
  <div class="mb-0 p-1 text-muted font-weight-bold" style="font-size:22px;">台灣口罩地圖查詢系統
      <span class="mb-0 p-1 text-muted text-right" style="font-size:14px;">(劉政彥 製作)</span></div>
      <hr>
    <div class="row no-gutters">
      <!-- 查詢條件含回傳結果清單畫面左邊(寬佔3) -->
      <div class="col-sm-3">
        <div class="toolbox">
          <div class="sticky-top bg-white shadow-sm p-2">
            <!-- 縣市下拉選單 -->
            <div class="form-group d-flex">
              <h5><label for="cityName" class="mr-2 col-form-label text-right font-weight-bold">
              縣市：</label></h5>
              <div class="flex-fill">
                <select id="cityName" class="form-control"
                v-model="select.city" @change="this.updateSelect(); select.area = ''">
                  <option value="">-- 請選擇 --</option>
                  <!-- 使用Vue來讀取cityName縣市資料跑迴圈產生縣市下拉選單(value & key=c.CityName) -->
                  <option :value="c.CityName" v-for="c in cityName" :key="c.CityName">
                  {{ c.CityName }}
                </option>
                </select>
              </div>
            </div>
            <!-- 地區下拉選單 -->
            <div class="form-group d-flex">
              <h5><label for="area" class="mr-2 col-form-label text-right font-weight-bold">
              地區：</label></h5>
              <div class="flex-fill">
                <select id="area" class="form-control" v-if="select.city.length"
                v-model="select.area" @change="updateSelect()">
                  <option value="">-- 請選擇 --</option>
                  <!-- 使用Vue來依照選擇的cityName縣市讀取area地區資料跑迴圈產生地區下拉選單(value & key=a.AreaName) -->
                  <!-- 需先預設一個cityName的預設值(ex:臺北市) -->
                  <option :value="a.AreaName"
                  v-for="a in cityName.find((city) => city.CityName === select.city).AreaList"
                  :key="a.AreaName">
                  {{ a.AreaName }}
                </option>
                </select>
              </div>
            </div>
            <p class="mb-0 text-muted text-right font-weight-bold">請先選擇區域查看（綠色底表示還有口罩）</p>
          </div>
          <!-- API回傳口罩地圖數量Json結果資料顯示清單 -->
          <ul class="list-group">
            <template v-for="(item, key) in data">
              <a class="list-group-item text-left" :key="key"
              v-if="item.properties.county === select.city
              && item.properties.town === select.area"
              :class="{'highlight': item.properties.mask_adult || item.properties.mask_child}"
              @click="updateSelect(); penTo(item)">
                <h5><strong>{{ item.properties.name }}</strong></h5>
                <p class="mb-0">
                  <strong>成人口罩 - {{ item.properties.mask_adult }} | 兒童口罩 -
                  {{ item.properties.mask_child }}</strong>
                </p>
                <p class="mb-0">地址：<small><a :href="`https://www.google.com.tw/maps/place/${item.properties.address}`"
                target="_blank" title="Google Map">
                {{ item.properties.address }}</a></small>
              </p>
              </a>
            </template>
          </ul>
        </div>
      </div>
      <!-- 查詢結果右邊地圖畫面(寬佔9) -->
      <div class="col-sm-9">
        <div id="map"></div>
      </div>
    </div>
  </div>
</template>

<script>
// 宣告L為導入leaflet.js圖資套件
import L from 'leaflet';
// 宣告cityName導入cityName.json資料
import cityName from './assets/cityName.json';

// 宣告產生Map畫面陣列物件
let osmMap = {};

// 宣告標示坐標圖示icon設定值
// const iconsConfig = {
//   iconSize: [25, 41],
//   iconAnchor: [12, 41],
//   popupAnchor: [1, -34],
//   shadowSize: [41, 41],
// };

// const icons = {
//   green: new L.Icon({
//     iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
//     ...iconsConfig,
//   }),
//   grey: new L.Icon({
//     iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
//     ...iconsConfig,
//   }),
// };

// 宣告一個osm，內含自訂方法
const osm = {
  // 自訂加入標示坐標圖示時會顯示的資訊方法
  // .bindPopup為按下標示坐標圖示時會顯示的資訊
  addMapMarker(x, y, item) {
    // const icon = item.mask_adult || item.mask_child ? icons.green : icons.grey;
    L.marker([x, y]).addTo(osmMap).bindPopup(`
          藥局名稱：<strong>${item.name}</strong><br>
          口罩剩餘：<strong>成人 - ${item.mask_adult ? `${item.mask_adult} 個` : '未取得資料'} | 兒童 - ${item.mask_child ? `${item.mask_child} 個` : '未取得資料'}</strong><br>
          地址：<a href="https://www.google.com.tw/maps/place/${item.address}" target="_blank">${item.address}</a><br>
          電話：<strong>${item.phone}</strong><br>
          更新時間：<strong>${item.updated}</strong><br>
          備註：<strong>${item.note}</strong>`);
  },
  // 自訂加入清除圖層的方法
  removeMapMarker() {
    osmMap.eachLayer((layer) => {
      // 如果畫面是使用Marker建立標示坐標圖層的話就清除此標示坐標圖層
      if (layer instanceof L.Marker) {
        osmMap.removeLayer(layer);
      }
    });
  },
  // 自訂加入移到該縣市坐標圖層的方法
  penTo(x, y, item) {
    // const icon = item.mask_adult || item.mask_child ? icons.green : icons.grey;
    osmMap.panTo(new L.LatLng(y, x));
    L.marker([y, x]).addTo(osmMap).bindPopup(`
          藥局名稱：<strong>${item.name}</strong><br>
          口罩剩餘：<strong>成人 - ${item.mask_adult ? `${item.mask_adult} 個` : '未取得資料'} | 兒童 - ${item.mask_child ? `${item.mask_child} 個` : '未取得資料'}</strong><br>
          地址：<a href="https://www.google.com.tw/maps/place/${item.address}" target="_blank">${item.address}</a><br>
          電話：<strong>${item.phone}</strong><br>
          更新時間：<strong>${item.updated}</strong><br>
          備註：<strong>${item.note}</strong>`);
  },
};

export default {
  name: 'App',
  // 建立data
  data: () => ({
    data: {},
    osmMap: {},
    cityName,
    select: {
      city: '臺北市',
      area: '中山區',
    },
  }),
  // 自訂增加method
  methods: {
    // 新增一個更新圖層的方法
    updateMarker() {
      // 宣告pharmacies為從資料廻圈內容一個一個的取出來的陣列資料
      // .filter是從資料廻圈內容一個一個的取出來
      const pharmacies = this.data.filter((pharmacy) => {
        if (!this.select.area) {
          return pharmacy.properties.county === this.select.city;
        }
        return pharmacy.properties.town === this.select.area;
      });
      // pharmacies迴圈處理資料
      pharmacies.forEach((pharmacy) => {
        // 宣告properties, geometry結構等於pharmacy(整個物件取出來過長時可用此宣告法)
        const { properties, geometry } = pharmacy;
        osm.addMapMarker(
          geometry.coordinates[0],
          geometry.coordinates[1],
          properties,
        );
      });
      // this.penTo(pharmacies[0]);
    },
    // 新增一個清除圖層的方法
    reomveMarker() {
      osm.removeMapMarker();
    },
    // 新增一個移到該縣市坐標圖層的方法
    penTo(pharmacy) {
      // 宣告properties, geometry結構等於pharmacy(整個物件取出來過長時可用此宣告法)
      const { properties, geometry } = pharmacy;
      osm.penTo(geometry.coordinates[0], geometry.coordinates[1], properties);
    },
    // 新增一個更新選擇下拉選單的方法
    updateSelect() {
      this.reomveMarker();
      this.updateMarker();
      // const pharmacy = this.data.find((item) => item.properties.town === this.select.area);
      // const { geometry, properties } = pharmacy;
      // osm.penTo(geometry.coordinates[0], geometry.coordinates[1], properties);
      // console.log(pharmacy);
    },
  },
  // mounted是不止把資料建立起來，也會連畫面結構也建立起來，要確保畫面能正確的建立起來要使用mounted
  mounted() {
    // 宣告maskAPIUrl為各藥局口罩數量資訊查詢api網址
    const maskApiUrl = 'https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json';

    // 各藥局口罩數量資訊回傳json格式
    // {
    //   "type": "Feature",
    //   "properties": {
    //       "id": "{id}",
    //       "name": "{藥局名稱}",
    //       "phone": "{電話}",
    //       "address": "{地址}",
    //       "mask_adult": "{大人口罩數量}",
    //       "mask_child": "{兒童口罩數量}",
    //       "updated": "{更新時間}",
    //       "available": "{營業時間}",
    //       "note": "{備註}",
    //       "custom_note": "{自訂備註}",
    //       "website": "{網址}",
    //       "county": "{縣市}",
    //       "town": "{地區}",
    //       "cunli": "{鄰里}",
    //       "service_periods": "{服務其間}"
    //    },
    //    "geometry": {
    //       "type": "Point",
    //       "coordinates": [
    //           {坐標X},
    //           {坐標Y}
    //       ]
    //    }
    // }

    // 取得遠端api資料方式1
    // .get為使用GET的方式取的資料
    // .then為確保資料取得後呈顯出來
    this.axios.get(maskApiUrl).then((response) => {
      this.data = response.data.features;
      // 取得各藥局口罩數量資料後更新圖層
      this.updateMarker();
    });
    // 取得遠端api資料方式2
    // Vue.axios.get(maskapiurl).then((response) => {
    //   console.log(response);
    // })
    // 取得遠端api資料方式3
    // this.$http.get(api).then((response) => {
    //   console.log(response.data)
    // })
    // .map為產生Map畫面
    osmMap = L.map('map', {
      center: [25.0590107, 121.5313507], // 坐標，目前中心位置定在何處，預設網飛訊公司坐標
      zoom: 17, // 縮放比例
    });
    // .tileLayer為繪製地圖圖資圖層路徑
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '<a target="_blank" href="https://www.openstreetmap.org/">© 2020 地圖 OpenStreetMap 提供，劉政彥開發</a>',
      maxZoom: 18, // 最大縮放比例
    }).addTo(osmMap);
    // 預設地圖圖標要標的坐標(預設為網飛訊公司坐標)
    L.marker([25.0590107, 121.5313507]).addto(osmMap);
  },
};
</script>

<style lang="scss">
// 導入bootstrap.css
@import 'bootstrap/scss/bootstrap';

// 地圖畫面預設直接滿畫面高
#map {
  height: 93vh;
}

// 如何這個藥局還有口罩的話就加上綠色的hight light
.highlight {
  background: #e9ffe3;
}

// 查詢條件含回傳結果清單畫面CSS
.toolbox {
  height: 100vh;
  overflow-y: auto;
  a {
    cursor: pointer;
  }
}
</style>
