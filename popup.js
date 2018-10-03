let asinButton = document.getElementById('asinButton');

chrome.storage.sync.get('color', function (data) {
    asinButton.style.backgroundColor = data.color;
    asinButton.setAttribute('value', data.color);
});

chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    let url = new URL(tabs[0].url);
    let reg = /dp|product\/(.*)\//g;
    while (match = reg.exec(url)) {
        let asin = match[1];
        asinButton.innerText = asin;
        asinButton.onclick = function (element) {
            alert(asin);
        };
    }
});
