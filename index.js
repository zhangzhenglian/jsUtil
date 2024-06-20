function waitForNode(selector, rootNode = document.body, checkIframe = false) {
    return new Promise((resolve, reject) => {
        // 封装节点检查逻辑
        const checkNode = (root) => {
            const existingNode = root.querySelector(selector);
            if (existingNode) {
                resolve(existingNode);
                return true;
            }
            return false;
        };

        // 递归检查所有 iframe
        const checkAllFrames = (root) => {
            if (checkNode(root)) return true;
            if (checkIframe) {
                const iframes = root.querySelectorAll('iframe');
                for (const iframe of iframes) {
                    try {
                        const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
                        if (checkNode(iframeDocument)) return true;
                    } catch (e) {
                        console.warn('Unable to access iframe content due to cross-origin restrictions:', iframe, e);
                    }
                }
            }
            return false;
        };

        // 初始化检查
        if (checkAllFrames(rootNode)) return;

        // 创建一个 MutationObserver 实例
        const observer = new MutationObserver((mutationsList, observer) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    if (checkAllFrames(rootNode)) {
                        observer.disconnect();
                        return;
                    }
                }
            }
        });

        // 配置观察选项
        const config = {
            childList: true, // 观察子节点
            subtree: true,   // 观察所有后代节点
        };

        // 开始观察目标节点
        observer.observe(rootNode, config);

        // 可选：设置一个超时时间，以防节点长期未出现
        const timeout = setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Timeout: Unable to find node matching selector "${selector}"`));
        }, 30000); // 30秒超时，可以根据需要调整

        // 清理定时器
        const clearObserverAndTimeout = (node) => {
            clearTimeout(timeout);
            observer.disconnect();
            resolve(node);
        };

        // 再次检查节点是否已经存在（以防在设置观察器期间节点出现）
        if (checkAllFrames(rootNode)) {
            clearObserverAndTimeout(rootNode.querySelector(selector));
        }
    });
}

