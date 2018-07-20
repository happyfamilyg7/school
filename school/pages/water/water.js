import WxParse from '../../wxParse/wxParse.js';
const app = getApp();
Page({

  data: {
    //遮罩层 
    mask: {
      opacity: 0,
      display: 'none',
    },
    //弹窗
    returnDeposit: {
      translateY: 'translateY(1500px)',
      opacity: 1
    }, 
    datas: '', //商品详情数据
    baseUrl: app.globalData.baseUrl, //图片路径
    lists: [], //送水列表数据
    water: '', //有桶无桶的数组
    floor: '', //楼层的数组
    freight: '0.00', //楼层的价格
    numbers: 1, //商品数量
    swiperIndexs: 0, //商品详情和规格参数的下标
    buy_type: '', //判断是购买还是加入购物车
    price: '', //有无桶的价格
    total: '', //总价
    choose2: 0, //楼层的下标
    choose: 0, //有桶无桶的下标
    list: [],
    // list3: [],
    // id: '',
    // record: [],
  },
  onLoad: function(option) {
    var schoolId = wx.getStorageSync('schoolId');
    var userId = wx.getStorageSync('userId');
    this.setData({
      schoolId: schoolId,
      userId: userId
    })
    this.getLists();
  },
  getLists() {

    var schoolId=this.data.schoolId;
     var  userId=this.data.userId;
    wx.showLoading({
      title: '加载中',
    });
    //送水列表接口
    wx.request({
      method: 'POST',
      url: `${app.globalData.api}goods/goodsList`,
      header: { 'content-type': 'application/x-www-form-urlencoded' },
      data: {
        schoolId: schoolId,
        proType: 2,
      },
      success: res => {
        console.log(res);
        this.setData({
          lists: res.data.data.root
        });
        let goodsId = res.data.data.root[this.data.choose].id;
        //送水详情接口（获取列表的第一个商品Id）
        wx.request({
          method: 'POST',
          url: `${app.globalData.api}goods/goodsInfo`,
          header: { 'content-type': 'application/x-www-form-urlencoded' },
          data: {
            schoolId: schoolId,
            goodsId: goodsId,
          },
          success: res => {
            console.log({ goodsId: goodsId })
            wx.hideLoading()
            console.log(res);
            this.setData({
              datas: res.data.pro
            });
            this.loadProductDetail();
            console.log(this.data.datas);
            let article = res.data.pro.content;
            article = article.replace(/&amp;nbsp;/g, ' ');
            WxParse.wxParse('article', 'html', article, this, 5);
          }
        });
      }
    });
  },
  // 商品详情数据获取
  loadProductDetail: function() {
    var that = this;
    var water = this.data.lists;
    var floor = [{ name: '一楼到三楼', price: '3.00' }, { name: '四楼到六楼', price: '5.00' }];
    // var stock = 999;
    var price = water[this.data.choose].price_yh;
    console.log(price);
    var freight = floor[this.data.choose2].price;
    var total = parseFloat(price) + parseFloat(freight);
    that.setData({
      water: water, //有桶无桶的数组
      floor: floor, //楼层的数组
      price: price, //有无桶的价格
      freight: freight, //楼层的价格
      total: total //总价
    });
  },
  // 加入购车、立即购买确定
  confirm: function(e) {
    var type = this.data.buy_type;
    var list = this.data.list;
    if (list[0]) {
      var specs = this.data.specs;
    } else {
      var specs = true;
    }
    if (specs) {
      if (type == 1) {
        this.buy_now();
      } else {
        this.addShopCart();
      }
      this.bindtapClose();
    } else {
      wx.showToast({
        title: '请选择规格',
        icon: 'none'
      })
    }
  },
  // 进入购物车
  go_cart() {
    wx.switchTab({
      url: '../cart/cart',
    })
  },
  // 立即购买
  buy_now() {
    var price = this.data.price;
    var freight = this.data.freight;
    var u_price = parseFloat(price) + parseFloat(freight);
    var choose = this.data.choose;
    var choose2 = this.data.choose2;
    var water0 = this.data.water;
    var floor = this.data.floor;
    var numbers = this.data.numbers;
    var water_item = { specs: water0[choose].name, floor: floor[choose2].name, img: app.globalData.baseUrl + water0[choose].photo_x, price: u_price, num: numbers, name: water0[choose].name, choose: choose, choose2: choose2, shopId: water0[choose].shopId, goods_id: water0[choose].id};
    wx.setStorageSync('water_buy', water_item);
    wx.navigateTo({
      url: '../submitOrder/submitOrder?type=2'
    })
  },
  // 加入购物车
  addShopCart() {
    var price = this.data.price;
    var freight = this.data.freight;
    var u_price = parseFloat(price) + parseFloat(freight);
    var choose = this.data.choose;
    var choose2 = this.data.choose2;
    var water0 = this.data.water;
    var floor = this.data.floor;
    var numbers = this.data.numbers;
    var water_item = { specs: water0[choose].name, floor: floor[choose2].name, img: app.globalData.baseUrl + water0[choose].photo_x, price: u_price, num: numbers, name: water0[choose].name, choose: choose, choose2: choose2, shopId: water0[choose].shopId, goods_id: water0[choose].id};

    var water = wx.getStorageSync('water_cart');
    var control = true;
    if (water) {
      var len = water.length;
      for (var i = 0; i < len; i++) {
        if (choose == water[i].choose && choose2 == water[i].choose2) {
          water[i].num += numbers;
          control = false;
        }
      }
      if (control) {
        water.push(water_item);
        control = false;
      }
    }
    if (control) {
      water = [];
      water.push(water_item);
    }
    wx.setStorageSync('water_cart', water);
    wx.showToast({
      title: '成功加入购物车',
      icon: 'none',
      duration: 1000
    })
  },
  // 选择楼层
  choose2(e) {
    var index = e.currentTarget.dataset.index;
    var price = this.data.price;
    var freight = e.currentTarget.dataset.price;
    var total = parseFloat(freight) + parseFloat(price);
    // var numbers = this.data.numbers;
    // total = total * numbers.toFixed(2);
    this.setData({
      choose2: index,
      freight: freight,
      total: total
    })
  },
  /* 选择规格事件 */
  choose(e) {
    var index = e.currentTarget.dataset.index;
    var price = e.currentTarget.dataset.price;
    // var freight = this.data.freight;
    // var numbers = this.data.numbers;
    // var total = parseFloat(freight) + parseFloat(price);
    // total = total * numbers.toFixed(2);
    this.setData({
      choose: index,
      price: price,
      // total: total
    })
    this.getLists();
  },
  //点击显示商品详情
  shopDetail() {
    this.setData({
      swiperIndexs: 0,
    })
  },
  //点击显示规格参数
  shopSize() {
    this.setData({
      swiperIndexs: 1,
    })
  },
  //商品数量减少
  bindtapJian() {
    if (this.data.numbers <= 1) {
      wx.showToast({
        title: '数量不能小于1',
        image: '/image/warning.png',
        duration: 1500
      })
    } else {
      let numbersJian = this.data.numbers*1 - 1;
      // var freight = this.data.freight;
      // var price = this.data.price;
      // var total = parseFloat(freight) + parseFloat(price);
      // total = total * numbersJian.toFixed(2);
      this.setData({
        numbers: numbersJian,
        // total: total
      })
    }
  },
  //商品数量增加
  bindtapJia() {
    var numbersJia = this.data.numbers*1 + 1;
    // var freight = this.data.freight;
    // var price = this.data.price;
    // var total = parseFloat(freight) + parseFloat(price);
    // total = total * numbersJia.toFixed(2);
    this.setData({
      numbers: numbersJia,
      // total: total
    })
  },
  //弹窗显示
  bindtapMasks(e) {
    var buy_type = e.currentTarget.dataset.type;
    this.setData({
      buy_type: buy_type
    })
    let mask = this.data.mask,
      returnDeposit = this.data.returnDeposit;
    mask.display = 'block';
    this.setData({ mask });
    mask.opacity = 1;
    returnDeposit.translateY = 'translateY(0)';
    returnDeposit.opacity = 1;
    this.setData({ mask, returnDeposit });
  },
  //关闭弹窗
  bindtapClose() {
    let mask = this.data.mask,
      returnDeposit = this.data.returnDeposit;
    mask.opacity = 0;
    returnDeposit.opacity = 0;
    this.setData({ mask, returnDeposit });
    setTimeout(() => {
      mask.display = 'none';
      returnDeposit.translateY = 'translateY(1500px)';
      this.setData({ mask, returnDeposit });
    }, 500);
  },
})