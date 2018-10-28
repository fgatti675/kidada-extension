const asinText = document.getElementById('asin');
const nameText = document.getElementById('name');
const shortDescriptionText = document.getElementById('short_description');
const brandText = document.getElementById('brand');
const priceText = document.getElementById('price');
const currencySelect = document.getElementById('currency');
const imageObject = document.getElementById('imageObject');
const feedExcluded = document.getElementById('feed_excluded');
const amazonLink = document.getElementById('amazonLink');
const amazonCountry = document.getElementById('amazonCountry');
const addToDadaki = document.getElementById('addToDadaki');
const categoriesGroup = document.getElementById('categories');
const logoutButton = document.getElementById('logout');
const loginGoogle = document.getElementById('loginGoogle');
const loginFacebook = document.getElementById('loginFacebook');
const loginForm = document.getElementById('loginform');

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

let productCode = null;
let productCountry = null;

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

const ProductObject = {
    added_on: firebase.firestore.FieldValue.serverTimestamp(),
    amazon_link: null,
    brand: null,
    image: null,
    last_featured: null,
    liked_by_count: 0,
    categories: [],
    name: null,
    short_description: null,
    feed_excluded: false,
    price: null,
    currency: null
};

chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    let url = new URL(tabs[0].url);
    //need to optimise
    if (url.host === "www.amazon.es") {
        productCountry = "es_ES";
    } else if (url.host === "www.amazon.de") {
        productCountry = "de_DE";
    } else if (url.host === "www.amazon.it") {
        productCountry = "it_IT";
    } else if (url.host === "www.amazon.co.uk") {
        productCountry = "en_GB";
    } else if (url.host === "www.amazon.com") {
        productCountry = "en_US";
    }
    // TODO: add site not supported mode
    let reg = /(([0-9]|[A-Z])+)\//g;
    while (match = reg.exec(url)) {
        let asin = match[1];
        productCode = asin;
        asinText.value = productCode;
    }
});

function getBrand(page) {
    let author = $.trim($(page).find('.authorNameLink').text());
    if (author) {
        return author;
    }
    return $.trim($(page).find('#bylineInfo').text());
}

function getPrice(page) {
    let price = $.trim($(page).find('#priceblock_ourprice').text());
    if (!price) {
        price = $.trim($(page).find('#buyNewSection .a-color-price').text());
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

chrome.runtime.onMessage.addListener(function (request, sender) {

    firebase.firestore().collection('sites').doc(productCountry).collection('categories')
        .orderBy('name', 'desc')
        .get()
        .then(snapshot => {
            let categories = "";
            snapshot.forEach((doc) => {
                categories = categories +
                    "  <label class=\"checkbox-inline p-1\"><input type=\"checkbox\" class='mr-2' value=\"" + doc.id + "\">"+ doc.data().name + "</label>\n"

            });
            categoriesGroup.innerHTML = categories;
            $(categoriesGroup).find("input").change(function(){
                let value = this.value;
                if(this.checked) {
                    ProductObject.categories.push(value);
                }
                else ProductObject.categories = ProductObject.categories.filter(function(item) {
                    return item !== value
                });
                console.log(ProductObject.categories);
            });
        });

    if (request.action === "getSource") {
        const page = $.parseHTML(request.source);

        let brand = getBrand(page);
        ProductObject.brand = brand;

        let name = $.trim($(page).find('#productTitle').text().replace(brand, ""));
        let separatorIndex =
            name.indexOf(" - ") > -1 ? name.indexOf(" - ") :
                name.indexOf(", ") > -1 ? name.indexOf(", ") :
                    name.indexOf(": ");
        if (separatorIndex > 0) {
            ProductObject.name = name.substring(0, separatorIndex).trim();
            ProductObject.short_description = name.substring(separatorIndex + 2, name.length).trim();
        } else {
            ProductObject.name = name;
        }

        ProductObject.price = getPrice(page);
        let image = $(page).find('.imgTagWrapper').find('img').attr("src");

        if(!image)
            image = $(page).find('img#imgBlkFront').attr("src");
        ProductObject.image = image;
        nameText.value = ProductObject.name;
        shortDescriptionText.value = ProductObject.short_description;
        brandText.value = ProductObject.brand;
        priceText.value = ProductObject.price;
        imageObject.src = ProductObject.image;

        //need to optimise
        ProductObject.amazon_link = countryInfo[productCountry].amazon_link + "/gp/product/" + productCode;
        ProductObject.currency = countryInfo[productCountry].currency;
        currencySelect.value = ProductObject.currency;
        amazonLink.value = ProductObject.amazon_link;
        amazonCountry.innerText = countryInfo[productCountry].name;

        nameText.onkeyup = function () {
            ProductObject.name = this.value;
        };
        shortDescriptionText.onkeyup = function () {
            ProductObject.short_description = this.value;
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
            productCode = this.value;
            ProductObject.amazon_link = countryInfo[productCountry].amazon_link + "/gp/product/" + productCode;
            amazonLink.value = ProductObject.amazon_link;
        };
        amazonLink.onkeyup = function () {
            ProductObject.amazon_link = this.value;
        };
        feedExcluded.onchange = function () {
            ProductObject.feed_excluded = this.value;
        };

        addToDadaki.onclick = function () {
            document.getElementById('main').style.display = 'none';
            document.getElementById('result').style.display = 'block';
            document.getElementById('result-text').innerHTML = '<p>loading...</p>';
            saveFile();
        }
    }
});

function onWindowLoad() {

    const message = document.querySelector('#message');

    $(loginForm).submit(function (event) {
        const username = $(this).find('#username').val();
        const password = $(this).find('#password').val();
        event.preventDefault();
        firebase.auth().signInWithEmailAndPassword(username, password).then(function (user) {
            console.log('User connected', user);
        }).catch(function (error) {
            $('#error').removeClass("d-none");
            $('#errorText').html(error.message);
        });
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
    });


    logoutButton.addEventListener("click", function () {
        firebase.auth().signOut().then(function () {
            // Sign-out successful.
        }).catch(function (error) {
            // An error happened.
        });
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
        }).catch(function (error) {
            // Handle Errors here.
            const errorCode = error.code;
            const errorMessage = error.message;
            // The email of the user's account used.
            const email = error.email;
            // The firebase.auth.AuthCredential type that was used.
            const credential = error.credential;
            console.log(error);
            // ...
        });
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
    // Get file name from url.
    const url = ProductObject.image;
    const filename = url.substring(url.lastIndexOf("/") + 1).split("?")[0];
    const xhr = new XMLHttpRequest();
    xhr.addEventListener("load", transferComplete);
    xhr.addEventListener("error", transferFailed);
    xhr.addEventListener("abort", transferCanceled);

    xhr.responseType = 'blob';
    xhr.onload = function () {
        const a = document.createElement('a');
        a.href = window.URL.createObjectURL(xhr.response); // xhr.response is a blob
        a.download = filename; // Set the file name.
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        delete a;

        if (this.status === 200) {
            // `blob` response
            const reader = new FileReader();
            reader.onload = function (e) {

                const auth = firebase.auth();
                const storageRef = firebase.storage().ref();

                const metadata = {
                    'contentType': 'image/jpeg'
                };

                const file = e.target.result;
                const base64result = reader.result.split(',')[1];
                const blob = b64toBlob(base64result);
                const uploadTask = storageRef.child('products/' + productCode + '.jpg').put(blob, metadata);

                uploadTask.on('state_changed', null, function (error) {
                    // [START onfailure]
                    console.error('Upload failed:', error);
                    // [END onfailure]
                }, function () {
                    console.log('Uploaded', uploadTask.snapshot.totalBytes, 'bytes.');
                    console.log(uploadTask.snapshot.metadata);
                    const imageRef = storageRef.child('products/' + productCode + '.jpg');
                    imageRef.getDownloadURL().then(function (url) {
                        ProductObject.image = url;
                        db.collection("sites").doc(productCountry).collection("products").doc(productCode).set(ProductObject)
                            .then(function () {
                                console.log("Product Uploaded");
                                document.getElementById('result-text').innerHTML = '<strong>Product Uploaded</strong>';
                            })
                            .catch(function (error) {
                                console.log(error);
                            });
                    });
                }).catch(function (error) {
                    console.log("image load error" + error);
                })


                // `data-uri`

            };
            reader.readAsDataURL(this.response);
        }
        ;
    };


    xhr.open('GET', url);
    xhr.send();
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

    const blob = new Blob(byteArrays, {type: contentType});
    return blob;
}


function transferComplete(evt) {
    console.log("transfer complete");
}

function transferFailed(evt) {
    console.log("An error occurred while transferring the file.");
}

function transferCanceled(evt) {
    console.log("The transfer has been canceled by the user.");
}

window.onload = onWindowLoad;
