if (typeof elementsByClassName !== 'undefined' && elementsByClassName) {
} else {
    let elementsByClassName = document.getElementsByClassName("imageThumbnail");
    let elements = [];
    Array.prototype.forEach.call(elementsByClassName, function (el) {
        elements.push(el);
    });
    elements.reverse();
    elements.forEach((el) => {
        el.click();
    });
    console.log("Injected script");
}
