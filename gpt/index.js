console.log("%c Line:2 🍤 GPT Helper is Working", "color:#ea7e5c");

class GPTHelper {

  interceptorActionMap
  countKey = 'GPT_RELOAD_COUNT'
  msgKey = 'GPT_MSG_CACHE'
  constructor() {
    this.interceptorActionMap = [
      [/backend-api\/conversation$/, this.handleConversationRes],
      [/featuregates\.org\/.+\/initialize/, this.handleInitailizeRes]
    ]
    window.onload = () => {
      // 在这里放置您的代码，DOM已经加载完毕
      this.interceptor();
      this.autoFill();
    }
  }

  // 是否需要拦截
  findActionFromMap = (url) => {
    return this.interceptorActionMap.find(([urlReg]) => urlReg.test(url)) || [];
  }

  interceptor = () => {
    const that = this;
    const _fetch = window.fetch;
    delete window.fetch;
    const myFetch = function (url, options) {
      const [, action] = that.findActionFromMap(url);
      // 不需要拦截则提前执行即可
      if (!action) return _fetch.apply(this, arguments);

      that.beforFetch(url, options);
      return _fetch.apply(this, arguments)
        .then((result) => {
          that.afterFetch(result, options, action);
          return result
        })

    }
    // 重新定义fetch, 不让覆盖
    Object.defineProperty(window, 'fetch', {
      value: myFetch,
      writable: false,
      configurable: false
    })
  }

  beforFetch = (url, options) => {
    // console.log("%c Line:27 🍯 beforFetch", "color:#f5ce50", url, options);
  }

  afterFetch = (result, options, action) => {
    console.log("%c Line:31 🌰 afterFetch", "color:#42b983", result, options, action);
    action && action(result, options)
  }

  /**
   * @description 处理回答超时(如果超时: 1.记录问题 2.刷新页面)
   * @date 26/04/2023
   * @param {*} result 结果
   * @param {*} options 请求参数
   * @memberof GPTHelper
   */
  handleConversationRes = (result, options) => {
    const { status } = result;

    if (status === 403) {
      // debugger
      const msg = this.safeGetMsg(this.safeParse(options.body));
      console.log("%c Line:55 🍌 msg", "color:#f5ce50", msg);
      // localStorage.setItem('GPT_MSG_CACHE', msg);
      this.msgCache(msg);
      this.reload();
    } else if (status === 200) {
      localStorage.removeItem(this, this.countKey)
    }
  }

  /**
   * @description 处理页面请求初始化时出发回填
   * @date 26/04/2023
   * @param {*} result 结果
   * @param {*} options 请求参数
   * @memberof GPTHelper
   */
  handleInitailizeRes = (result, options) => {
    const { status } = result;
    if (status === 200) {
      this.autoFill();
    }
  }

  /**
   * @description 自动回填答案逻辑
   * @date 26/04/2023
   * @memberof GPTHelper
   */
  autoFill = () => {
    const form = document.getElementsByClassName('stretch')[0];
    const msg = this.msgCache();
    console.log("%c Line:106 🍢 form", "color:#33a5ff", form);
    console.log("%c Line:90 🍇 msg", "color:#7f2b82", msg);
    if (!form) return;
    if (!msg) return;
    const [textArea, button] = form;
    setTimeout(() => {
      this.clearCache();
      textArea.value = msg;
      button.disabled = false;
      button.click();
    }, 1000)
  }

  reload = () => {
    const { countKey } = this;
    const count = Number(localStorage.getItem(countKey)) || 0;
    // 超出三次就停止,防止死循环
    if (count > 3) {
      // localStorage.removeItem(countKey);
      this.clearCache();
      return;
    }
    localStorage.setItem(countKey, count + 1);
    location.reload();
  }

  clearCache = (keyList = [this.countKey, this.msgKey]) => {
    keyList.forEach(key => {
      localStorage.removeItem(key);
    })
  }

  msgCache = (msg, del) => {
    const k = 'GPT_MSG_CACHE';
    const read = () => {
      const val = localStorage.getItem(k);
      return val
    };
    const write = () => {
      return localStorage.setItem(k, msg)
    };
    return msg ? write() : read();
  }

  safeParse(str) {
    try {
      return JSON.parse(str)
    } catch (error) {
      return str
    }
  }
  safeGetMsg(obj) {
    try {
      return obj.messages[0].content.parts[0]
    } catch (error) {
      return ''
    }
  }
}
new GPTHelper();