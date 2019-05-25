const debounce = function (action, idle) {
  var last;
  return function () {
    var ctx = this,
      args = arguments;
    clearTimeout(last);
    last = setTimeout(function () {
      action.apply(ctx, args);
    }, idle);
  };
};
const throttle = function (action, delay) {
  var last = 0;
  return function () {
    var curr = +new Date();
    if (curr - last > delay) {
      action.apply(this, arguments);
      last = curr;
    }
  };
};
// let api = process.env.NODE_ENV !== "production" ? "/api" : "";
const baseUrl = '/api/arknights/',
  regPicUrl = baseUrl + 'regPic',
  picUrl = baseUrl + 'data/pic/skill',
  postDataUrl = baseUrl + 'data';


//识别文字
const RegconizeFetch = imgData => {
  return fetch(regPicUrl, {
    method: 'POST',
    body: imgData,
    headers: new Headers({
      'Content-Type': 'text/plain'
    })
  })
    .then(res => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            // const temp = ;
            resolve(res.json());
            // console.log(temp);
          } catch (err) {
            console.log(err);
            reject(err);
          }
        }, 300);
      });
    })
    .catch(error => console.error('Error:', error));
};

const scan = async (data, insertCB) => {
  // switch 共用一个i
  const scanArr = data.scanArr,
    switchDefault = data.switchDefault,
    img = data.img;
  let temp = [], i = 0;
  for (let rect of scanArr) {
    console.log(rect.id);
    const tempCanvas = makeNewCanvas(rect, img, insertCB);
    const imgData = tempCanvas.toDataURL().split(',')[1];

    const result = await RegconizeFetch(imgData);
    data.self.scanPercentage = ++i / scanArr.length * 100;
    temp.push(switchDefault(rect, result));
  }

  return temp;
};


//上传图片
const postPicFetch = formData => {
  console.log(formData);
  return fetch(picUrl, {
    method: 'PUT',
    body: formData
  })
    .catch(error => console.error('Error:', error))
    .then(response => console.log('Success:', response));
};


const insertImg = (picArr, baseImg) => {
  return new Promise((resolve, reject) => {
    if (picArr.length === 0) {
      return;
    }
    for (const rect of picArr) {
      const canvas = makeNewCanvas(rect, baseImg);
      let name = rect.id.split('-')[1];

      canvas.toBlob(blob => {
        const imgContainer = new Image();
        imgContainer.style.width = '100%';

        imgContainer.onload = function () {
          console.log(imgContainer);
        };
        imgContainer.src = URL.createObjectURL(blob);
        console.log(name);
        if (name === 'skill') {
          const id = rect.id.split('-')[2];
          name = 'skill-' + id;
        }

        const container = document.querySelector('#' + name);
        if (!container) reject('id error');
        removeChildNode(container);
        container.appendChild(imgContainer);

        resolve({ id: 'pic-' + name, blob });
        function removeChildNode(container) {
          if (container.childNodes.length > 0) {
            container.childNodes.forEach(node => node.remove());
          }
        }
      });

    }
  });

};


const makeNewCanvas = (rect, img, callback) => {
  const _canvas = document.createElement('canvas'),
    r = img.width / 1280,
    ctx = _canvas.getContext('2d');

  _canvas.width = rect.width * r;
  _canvas.height = rect.height * r;

  ctx.drawImage(
    img,
    rect.x * r,
    rect.y * r,
    rect.width * r,
    rect.height * r,
    0,
    0,
    _canvas.width,
    _canvas.height
  );
  let dataURL = _canvas.toDataURL();
  const id = rect.id;
  if (callback) {
    callback(id, dataURL);
  }
  return _canvas;

};

//更新角色数据函数
// const testUrl = 'https://epic7-test-demo.oss-cn-beijing.aliyuncs.com/epic7/charactor/%E9%BA%97%E8%BF%AA%E5%8D%A1/stats.json?Expires=1551970837&OSSAccessKeyId=TMP.AQGAqOIjt29HIZw1xZMPKVMR--Nsv89KqmdLCZKbo3-H95Ua2GkQsJJ1PWKlMC4CFQD1MyVcPruPjJ_e-lXmL0TNiFK-BAIVAPsBGP7dlCs-p2wkGIv8JD3nRy1k&Signature=0HkBFFX9o%2Bizinl7rPULQBNy2Hs%3D'


const postData = (data) => {
  return fetch(postDataUrl, {
    method: 'PUT',
    headers: new Headers({
      'Content-type': 'application/json; charset=utf-8'
    }),
    body: JSON.stringify(data)
    // mode: 'cors'
  })
    .then(res => {
      return res.text().then(text => {
        const result = {
          message: text,
          type: res.status === 200 ? 'success' : 'error'
        };
        return result;
        // const a = JSON.stringify(json)
      });
    })
    .catch(err => {
      console.log(err);
    });
};
const getNameList = () => {
  return fetchGet('/api/arknights/data/nameList')
    .then(res => {
      res.forEach(hero => {
        if (hero.url)
          hero.url = 'https' + hero.url.slice(4);
      });
      return res;
    })
    .catch(err => {
      console.log(err);
      return [];
    });
};

const getProfileList = () => {
  console.log('/???');
  return fetchGet('/api/arknights/data/shortList')
    .then(res => fetchGet('https' + res.url.slice(4)))
    // .fetchGet(url)
    .then(res => {
      res.forEach(hero => {
        if (hero.url)
          hero.url = 'https' + hero.url.slice(4);
      });
      return res;
    })
    .catch(err => {
      console.log(err);
      return [];
    });
};

const getMoraleList = () => {
  return fetchGet('/api/epic7/data/morale')
    .then(res => fetchGet('https' + res.url.slice(4)));
};

const getHeroPic = name => {
  return fetchGet('/api/epic7/data/pic?name=' + name)
    .catch(err => {
      console.error(err);
      return [];
    });
};
const getHeroDataByName = name => {
  return fetchGet('/api/arknights/data/data?name=' + name);
};
const getHeroData = name => {
  return fetchGet(path + 'char/data/' + name + '.json')
    .catch(err => console.error(err));
};

//包装fetch，使用get
const fetchGet = (url) => {
  return fetch(url, {
    method: 'GET'
  }).then(res => {
    if (res.ok)
      return res.json();
    else
      return Promise.reject('server error');
  });
};


function sort(array, less) {

  function swap(i, j) {
    var t = array[i];
    array[i] = array[j];
    array[j] = t;
  }

  function quicksort(left, right) {

    if (left < right) {
      var pivot = array[left + Math.floor((right - left) / 2)],
        left_new = left,
        right_new = right;

      do {
        while (less(array[left_new], pivot)) {
          left_new += 1;
        }
        while (less(pivot, array[right_new])) {
          right_new -= 1;
        }
        if (left_new <= right_new) {
          swap(left_new, right_new);
          left_new += 1;
          right_new -= 1;
        }
      } while (left_new <= right_new);

      quicksort(left, right_new);
      quicksort(left_new, right);

    }
  }

  quicksort(0, array.length - 1);

  return array;
}


const sortByTime = data => {
  const format = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });
  data.forEach(element => {
    const date = element.time ? new Date(element.time) : '';
    if (date) element.time = format.format(date);
    element.editing = false;
  });
  try {
    return sort(data, (a, b) => {
      return a.time > b.time;
    });
  } catch (error) {
    console.log(error);
  }
};

const class_chinese = {
  MEDIC: { text: '医疗', value: 'MEDIC', short: '医' },
  CASTER: { text: '术士', value: 'CASTER', short: '术' },
  SNIPER: { text: '狙击', value: 'SNIPER', short: '狙' },
  WARRIOR: { text: '近卫', value: 'WARRIOR', short: '战' },
  PIONEER: { text: '先锋', value: 'PIONEER', short: '先' },
  TANK: { text: '重装', value: 'TANK', short: '重' },
  SPECIAL: { text: '特种', value: 'SPECIAL', short: '特' },
  SUPPORT: { text: '辅助', value: 'SUPPORT', short: '辅' },

};

const getClass_Chinese = en => {
  return class_chinese[en].text;
};

const getClass_Short = en => {
  return class_chinese[en].short;
};

const TagsArr = [
  { 'text': '治疗', 'value': '治疗', 'short': '治疗' },
  { 'text': '支援', 'value': '支援', 'short': '支援' },
  { 'text': '新手', 'value': '新手', 'short': '新手' },
  { 'text': '费用回复', 'value': '费用回复', 'short': '费用回复' },
  { 'text': '输出', 'value': '输出', 'short': '输出' },
  { 'text': '生存', 'value': '生存', 'short': '生存' },
  { 'text': '防护', 'value': '防护', 'short': '防护' },
  { 'text': '群攻', 'value': '群攻', 'short': '群攻' },
  { 'text': '减速', 'value': '减速', 'short': '减速' },
  { 'text': '削弱', 'value': '削弱', 'short': '削弱' },
  { 'text': '快速复活', 'value': '快速复活', 'short': '快速复活' },
  { 'text': '位移', 'value': '位移', 'short': '位移' },
  { 'text': '召唤', 'value': '召唤', 'short': '召唤' },
  { 'text': '控场', 'value': '控场', 'short': '控场' }];

// const tags = ['治疗',
//   '支援',
//   '新手',
//   '费用回复',
//   '输出',
//   '生存',
//   '防护',
//   '群攻',
//   '减速',
//   '削弱',
//   '快速复活',
//   '位移',
//   '召唤',
//   '控场',
// ];
// tags.forEach(el => {
//   TagsArr.push({ text: el, value: el, short: el });
// });

const path = 'https://arknights-data.oss-cn-beijing.aliyuncs.com/dataX/';

export {
  debounce,
  throttle,
  scan,
  postData,
  getNameList,
  insertImg,
  postPicFetch,
  getHeroData,
  getHeroPic,
  sort,
  sortByTime,
  getProfileList,
  getHeroDataByName,
  getMoraleList,
  getClass_Chinese,
  TagsArr,
  path,
  getClass_Short,
  class_chinese,
  fetchGet
};

