const asinText = document.getElementById('asin');
const nameText = document.getElementById('name');
const shortDescriptionText = document.getElementById('short_description');
const editorsCommentText = document.getElementById('editors_comment');
const brandText = document.getElementById('brand');
const priceText = document.getElementById('price');
const currencySelect = document.getElementById('currency');
const imageObject = document.getElementById('imageObject');
const feedExcluded = document.getElementById('feed_excluded');
const amazonLink = document.getElementById('amazonLink');
const amazonCountry = document.getElementById('amazonCountry');
const categoriesGroup = document.getElementById('categories');
const logoutButton = document.getElementById('logout');
const loginGoogle = document.getElementById('loginGoogle');
const submitButton = document.getElementById('submit-button');
const loginFacebook = document.getElementById('loginFacebook');
const loginForm = document.getElementById('loginform');

let invalidUrl = false;
const countryInfo = {
    "es_ES": {
        "currency": "EUR",
        "amazon_link": "https://www.amazon.es",
        "name": "Spain"
    },
    "it_IT": {
        "currency": "EUR",
        "amazon_link": "https://www.amazon.it",
        "name": "Italy"
    },
    "en_US": {
        "currency": "USD",
        "amazon_link": "https://www.amazon.com",
        "name": "United States"
    },
    "de_DE": {
        "currency": "EUR",
        "amazon_link": "https://www.amazon.de",
        "name": "Germany"
    },
    "en_GB": {
        "currency": "GBP",
        "amazon_link": "https://www.amazon.co.uk",
        "name": "Great Britain"
    }
};

let productAsin = null;
let locale = null;

const categories = null;

// Initialize Firebase
const config = {
    apiKey: "AIzaSyDVCZQKtM9dxiUN60Eeq61bea0J5L-3pck",
    authDomain: "dada-ki.firebaseapp.com",
    databaseURL: "https://dada-ki.firebaseio.com",
    projectId: "dada-ki",
    storageBucket: "dada-ki.appspot.com",
    messagingSenderId: "233370791898"
};
firebase.initializeApp(config);

const db = firebase.firestore();
db.settings({
    timestampsInSnapshots: true
});

let ProductObject = {
    added_on: firebase.firestore.FieldValue.serverTimestamp(),
    added_by: null,
    amazon_link: null,
    brand: null,
    images: [],
    last_featured: null,
    category: null,
    name: null,
    short_description: null,
    editors_comment: null,
    feed_excluded: false,
    price: null,
    currency: null
};

let existingProduct = false;

function setWrongPageMode() {
    $('#main').addClass("d-none");
    $('#login').addClass("d-none");
    $('#loader').addClass("d-none");
    $('#wrong_site').removeClass("d-none");
}

chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    let url = new URL(tabs[0].url);
    //need to optimise
    if (url.host === "www.amazon.es") {
        locale = "es_ES";
    } else if (url.host === "www.amazon.de") {
        locale = "de_DE";
    } else if (url.host === "www.amazon.it") {
        locale = "it_IT";
    } else if (url.host === "www.amazon.co.uk") {
        locale = "en_GB";
    } else if (url.host === "www.amazon.com") {
        locale = "en_US";
    } else {
        invalidUrl = true;
        console.error("Wrong host");
        setWrongPageMode();
        return;
    }

    let reg = /\/(([0-9]|[A-Z])+)(\/|\?|$)/g;
    while (match = reg.exec(url)) {
        let asin = match[1];
        productAsin = asin;
    }

    if (!productAsin) {
        console.error("Wrong asin");
        invalidUrl = true;
    }
});


function loadCategories() {
    firebase.firestore().collection('sites').doc(locale).collection('categories')
        .orderBy('meta_category', 'desc')
        .get()
        .then(snapshot => {
            let categoriesHtml = "";
            const metaCategories = new Map();
            snapshot.forEach((item) => {
                const key = item.data()['meta_category'];
                const collection = metaCategories.get(key);
                if (!collection) {
                    metaCategories.set(key, [item]);
                } else {
                    collection.push(item);
                }
            });
            metaCategories.forEach((values, key, map) => {
                categoriesHtml = categoriesHtml + "<div class='p-1 w-25 '>";
                categoriesHtml = categoriesHtml + "<div class='bg-light p-2'>";
                categoriesHtml = categoriesHtml + "<div class=\"small\"><strong>" + key + "</strong></div>";
                values.forEach((doc) => {
                    const checked = ProductObject.category === doc.id ? " checked " : "";
                    categoriesHtml = categoriesHtml + "<div class=\"form-check\">" +
                        "<input class=\"form-check-input\" type=\"radio\" name=\"choice\" value=\"" + doc.id + "\" required " +
                        checked +
                        ">" +
                        "<label class=\"form-check-label small\" for=\"" + doc.id + "\">" + doc.data().name + "</label>" +
                        "</div>";
                    console.log(categoriesHtml);
                });
                categoriesHtml = categoriesHtml + "</div>";
                categoriesHtml = categoriesHtml + "</div>";
            });

            categoriesGroup.innerHTML = categoriesHtml;
            $(categoriesGroup).find("input").change(function () {
                ProductObject.category = this.value;
                console.log(ProductObject);
            });
        }).catch((reason) => showError(reason));
}


function bindForm() {

    asinText.value = productAsin;

    nameText.value = ProductObject.name;
    shortDescriptionText.value = ProductObject.short_description;
    editorsCommentText.value = ProductObject.editors_comment;
    brandText.value = ProductObject.brand;
    priceText.value = ProductObject.price;
    imageObject.src = ProductObject.images[0];

    currencySelect.value = ProductObject.currency;
    amazonLink.value = ProductObject.amazon_link;
    amazonCountry.innerText = countryInfo[locale].name;
}

function bindExistingProduct(snapshot) {
    ProductObject = {
        "asin": snapshot.id,
        "amazon_link": snapshot.get('amazon_link'),
        "images": snapshot.get('images'),
        "brand": snapshot.get('brand'),
        "name": snapshot.get('name'),
        "currency": snapshot.get('currency'),
        "price": snapshot.get('price'),
        "short_description": snapshot.get('short_description'),
        "editors_comment": snapshot.get('editors_comment'),
        "category": snapshot.get('category'),
        "feed_excluded": snapshot.get('feed_excluded'),
        "added_on": snapshot.get('added_on'),
        "last_featured": snapshot.get('last_featured'),
        "liked_by_count": snapshot.get('liked_by_count'),
    };
}

chrome.runtime.onMessage.addListener(function (request, sender) {

    if (request.action === "getSource") {
        firebase.firestore().collection('sites').doc(locale).collection('products')
            .doc(productAsin)
            .get()
            .then(snapshot => {
                if (snapshot.exists) {
                    document.getElementById('already_there').classList.remove("d-none");
                    existingProduct = true;
                    submitButton.innerText = "Update product";
                    bindExistingProduct(snapshot);
                } else {
                    parseSourcePage(request);
                }
                bindForm();
            }).catch((reason) => showError(reason));

        loadCategories();
        addFormListeners();
    }
});

function addFormListeners() {
    nameText.onkeyup = function () {
        ProductObject.name = this.value;
    };
    shortDescriptionText.onkeyup = function () {
        ProductObject.short_description = this.value;
    };
    editorsCommentText.onkeyup = function () {
        ProductObject.editors_comment = this.value;
    };
    brandText.onkeyup = function () {
        ProductObject.brand = this.value;
    };
    priceText.onkeyup = function () {
        ProductObject.price = parseFloat(this.value);
    };
    currencySelect.onchange = function () {
        ProductObject.currency = this.value;
    };
    asinText.onkeyup = function () {
        productAsin = this.value;
        ProductObject.amazon_link = countryInfo[locale].amazon_link + "/gp/product/" + productAsin;
        amazonLink.value = ProductObject.amazon_link;
    };
    amazonLink.onkeyup = function () {
        ProductObject.amazon_link = this.value;
    };
    feedExcluded.onchange = function () {
        ProductObject.feed_excluded = this.checked;
    };

    const form = document.getElementById('main-form');
    form.addEventListener('submit', function (event) {
        validateNameAndDescription();
        event.preventDefault();
        form.classList.add('was-validated');
        if (form.checkValidity() === false) {
            console.log('Not validated');
            event.stopPropagation();
            return;
        }
        console.log('Validated');
        document.getElementById('main').classList.add("d-none");
        document.getElementById('loader').classList.remove("d-none");
        saveFile();
    });
}


function validateNameAndDescription() {
    console.log(ProductObject.name.length);
    console.log(nameText.maxLength);
    if (!ProductObject.short_description) {
        shortDescriptionText.setCustomValidity("Invalid field.");
    }
    else if (!ProductObject.name || ProductObject.name.length > nameText.maxLength) {
        nameText.setCustomValidity("Invalid field.");
    }
    else if (ProductObject.name.length > ProductObject.short_description.length) {
        nameText.setCustomValidity("Invalid field.");
        shortDescriptionText.setCustomValidity("Invalid field.");
    } else {
        nameText.setCustomValidity("");
        shortDescriptionText.setCustomValidity("");
    }
}


function onWindowLoad() {

    const message = document.querySelector('#message');

    $(loginForm).submit(function (event) {
        const username = $(this).find('#username').val();
        const password = $(this).find('#password').val();
        event.preventDefault();
        firebase.auth().signInWithEmailAndPassword(username, password).then(function (user) {
            console.log('User connected', user);
        }).catch(error => showError(error.message));
    });

    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            $('#main').removeClass("d-none");
            $('#login').addClass("d-none");
        } else {
            $('#main').addClass("d-none");
            $('#login').removeClass("d-none");
        }
        $('#loader').addClass("d-none");
        if (invalidUrl)
            setWrongPageMode();
    });

    logoutButton.addEventListener("click", function () {
        firebase.auth().signOut()
            .then(function () {
                // Sign-out successful.
            }).catch(error => showError(error.message));
    });

    loginGoogle.addEventListener("click", function () {
        const provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider).then(function (result) {
            // This gives you a Google Access Token. You can use it to access the Google API.
            const token = result.credential.accessToken;
            // The signed-in user info.
            const user = result.user;
            console.log(user);
            // ...
        }).catch(error => showError(error.message));
    });

    chrome.tabs.executeScript(null, {
        file: "getPagesSource.js"
    }, function () {
        // If you try and inject into an extensions page or the webstore/NTP you'll get an error
        if (chrome.runtime.lastError) {
            message.innerText = 'There was an error injecting script : \n' + chrome.runtime.lastError.message;
        }
    });

    $(function () {
        $('[data-toggle="tooltip"]').tooltip()
    })
}


// Download a file form a url.
function saveFile() {

    function transferComplete(evt) {
        console.log("transfer complete");
    }

    function transferFailed(evt) {
        console.log("An error occurred while transferring the file.");
    }

    function transferCanceled(evt) {
        console.log("The transfer has been canceled by the user.");
    }

    // Get file name from url.
    const url = ProductObject.images[0];
    const xhr = new XMLHttpRequest();
    xhr.addEventListener("load", transferComplete);
    xhr.addEventListener("error", transferFailed);
    xhr.addEventListener("abort", transferCanceled);

    xhr.responseType = 'blob';
    xhr.onload = function () {
        if (this.status === 200) {
            // `blob` response
            const reader = new FileReader();
            reader.onload = function (e) {

                const auth = firebase.auth();

                console.log(firebase.auth());
                ProductObject.added_by = firebase.auth().currentUser.uid;

                const storageRef = firebase.storage().ref();

                const metadata = {
                    'contentType': 'image/jpeg'
                };

                const file = e.target.result;
                const base64result = reader.result.split(',')[1];
                const blob = b64toBlob(base64result);
                const uploadTask = storageRef.child('products/' + productAsin + '.jpg').put(blob, metadata);

                uploadTask.on('state_changed', null, function (error) {
                    // [START onfailure]
                    console.error('Upload failed:', error);
                    // [END onfailure]
                }, function () {
                    console.log('Uploaded', uploadTask.snapshot.totalBytes, 'bytes.');
                    const imageRef = storageRef.child('products/' + productAsin + '.jpg');
                    imageRef.getDownloadURL().then(function (url) {
                        ProductObject.images[0] = url;

                        let onProductSaved = function () {
                            console.log("Product Uploaded");
                            document.getElementById('loader').classList.add("d-none");
                            document.getElementById('result').classList.remove("d-none");
                            document.getElementById('result-text').innerHTML = '<strong>Product Uploaded &#x1F64C\t</strong>';
                        };

                        let doc = db.collection("sites").doc(locale).collection("products").doc(productAsin);
                        if (!existingProduct) {
                            ProductObject["liked_by_count"] = 0;
                            doc.set(ProductObject)
                                .then(onProductSaved).catch(error => showError(error.message));
                        }
                        else {
                            doc.update(ProductObject)
                                .then(onProductSaved).catch(error => showError(error.message));
                        }
                    }).catch(error => showError(error.message));
                });

            };
            reader.readAsDataURL(this.response);
        }
    };

    xhr.open('GET', url);
    xhr.send();
}

function showError(errorMessage) {
    document.getElementById('loader').classList.add("d-none");
    document.getElementById('main').classList.remove("d-none");
    document.getElementById('error').classList.remove("d-none");
    document.getElementById('errorText').innerHTML = `<p>${errorMessage}</p>`;
}

function b64toBlob(b64Data, contentType, sliceSize) {
    contentType = contentType || '';
    sliceSize = sliceSize || 512;

    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, {type: contentType});
}

function sentenceCase(input) {
    input = (input === undefined || input === null) ? '' : input;
    return input.toString().replace(/(^|\. *)([a-z])/g, function (match, separator, char) {
        return separator + char.toUpperCase();
    });
}

function sanitize(s) {
    const regex = /[\s\t\n\r]+/g;
    return s.replace(regex, " ").trim();
}


function parseSourcePage(request) {

    function getBrand(page) {
        let author = $.trim($(page).find('.authorNameLink').text());
        if (author) {
            return sanitize(author);
        }
        return sanitize($.trim($(page).find('#bylineInfo').text()));
    }

    function getPrice(page) {
        let price = $.trim($(page).find('#priceblock_ourprice').text());

        if (!price) {
            price = $.trim($(page).find('.a-size-base .a-color-price .priceblock_vat_inc_price').text());
        }

        if (!price) {
            price = $.trim($(page).find('#buyNewSection .a-color-price').text());
        }

        if (!price) {
            price = $.trim($(page).find('.a-color-price').text());
        }
        let cleanedPrice = cleanPrice(price);
        return parseFloat(cleanedPrice);
    }

    function cleanPrice(string) {
        // EUR
        string = string.replace("EUR ", "");
        // $
        string = string.replace("$", "");
        // £
        string = string.replace("£", "");

        string = string.replace(",", ".");
        return string;
    }

    const page = $.parseHTML(request.source);

    let brand = getBrand(page);
    ProductObject.brand = brand;

    let brandRegEx = brand.length > 3
        ? brand
            .replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
            .replace(/[a-zA-Z0-9]/g, '$&\\s*')
            .replace(/[aàáâäãåā]/g, '[aàáâäãåā]')
            .replace(/[eèéêëēė]/g, '[eèéêëēė]')
            .replace(/[iîïíīįì]/g, '[iîïíīįì]')
            .replace(/[oøôöòó]/g, '[oøôöòó]')
            .replace(/[uûüùúū]/g, '[uûüùúū]')
        : brand;

    console.log(brandRegEx);
    const nameRegEx = new RegExp(
        brandRegEx,
        "ig");

    let name = $(page).find('#productTitle').text().replace(nameRegEx, "").trim();
    if (name.startsWith("- ") || name.startsWith("\u8211") || name.startsWith("\u2013")) // –
        name = name.substring(2, name.length);

    // check if one of this strings is there to separate
    let separatorIndex =
        name.indexOf("- ") > -1 ? name.indexOf("- ") :
            name.indexOf("–") > -1 ? name.indexOf("–") :
                name.indexOf("\u2013") > -1 ? name.indexOf("\u2013") :
                    name.indexOf("\u2014") > -1 ? name.indexOf("\u2014") :
                        name.indexOf("\u2015") > -1 ? name.indexOf("\u2015") :
                            name.indexOf("; ") > -1 ? name.indexOf("; ") :
                                name.indexOf("| ") > -1 ? name.indexOf("| ") :
                                    name.indexOf(": ") > -1 ? name.indexOf(": ") :
                                        name.indexOf(", ");
    if (separatorIndex > -1) {
        ProductObject.name = sanitize(name.substring(0, separatorIndex).trim());
        ProductObject.short_description = sanitize(name.substring(separatorIndex + 1, name.length).trim());
    } else {
        // check if there is a long string between parenthesis
        let regExp = /(\([^)]+\))$/;
        let matches = regExp.exec(name);
        if (matches) {
            let description = matches[1]; // description with parenthesis
            ProductObject.name = sanitize(name.replace(description, "").trim());
            ProductObject.short_description = sanitize(description.substring(1, description.length - 1));
        } else {
            ProductObject.name = sanitize(name);
        }
    }

    if (ProductObject.name)
        ProductObject.name = sentenceCase(ProductObject.name);
    if (ProductObject.short_description) {
        ProductObject.short_description = ProductObject.short_description.replace(";", ".");
        ProductObject.short_description = sentenceCase(ProductObject.short_description.replace(";", "."));
    }

    ProductObject.price = getPrice(page);

    let image = $(page).find('.selected .imgTagWrapper').find('img').attr("src");
    if (!image)
        image = $(page).find('img#imgBlkFront').attr("src");
    ProductObject.images[0] = image;

    ProductObject.amazon_link = countryInfo[locale].amazon_link + "/gp/product/" + productAsin;
    ProductObject.currency = countryInfo[locale].currency;


}

window.onload = onWindowLoad;
