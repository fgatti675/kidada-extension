let codeText = document.getElementById('code');
let titleText = document.getElementById('title');
let brandText = document.getElementById('brand');
var priceText = document.getElementById('price');
var imageText = document.getElementById('image');
var imageObject = document.getElementById('imageObject');
var amazonLink = document.getElementById('amazonLink');
var amazonCountry = document.getElementById('amazonCountry');
var addToKidada = document.getElementById('addToKidada');

var productCode = null;
var productCountry = null;



// Initialize Firebase
// TODO: Replace with your project's customized code snippet
var config = {
    apiKey: "AIzaSyDKM3Tjm7aGKUx86JrNXTVt7zcZ4-0R1Bk",
    authDomain: "dada-ism.firebaseapp.com",
    databaseURL: "https://dada-ism.firebaseio.com",
    projectId: "dada-ism",
    storageBucket: "dada-ism.appspot.com",
    messagingSenderId: "632379132030",
};
firebase.initializeApp(config);

var db = firebase.firestore();

db.settings({
    timestampsInSnapshots: true
});

var ProductObject = {
    added_on: firebase.firestore.FieldValue.serverTimestamp(),
    amazon_link: null,
    brand: null,
    image: null,
    last_featured: null,
    liked_by_count: 0,
    name: null,
    price: null,
    currency: null
}


chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    let url = new URL(tabs[0].url);
    //need to optimise
    if (url.host === "www.amazon.es"){
      productCountry = "es_ES";
    }else if (url.host === "www.amazon.de"){
      productCountry = "de_DE";
    }else if (url.host === "www.amazon.it"){
      productCountry = "it_IT";
    }else if (url.host === "www.amazon.co.uk"){
      productCountry = "en_GB";
    }else if (url.host === "www.amazon.com"){
      productCountry = "en_US";
    }
    let reg = /(dp|product)\/(.*)\//g;
    while (match = reg.exec(url)) {
        let asin = match[2];
        console.log(match);
        console.log(asin);
        productCode = asin;
        codeText.value = productCode;
    }
});

function cleanPrice(string){
    // EUR
    string = string.replace("EUR ", "");
    // $
    string = string.replace("$", "");
    // £
    string = string.replace("£", "");
    return string;
}

chrome.runtime.onMessage.addListener(function(request, sender) {
    if (request.action == "getSource") {
        var page = $.parseHTML( request.source );
        ProductObject.name = $.trim($(page).find('#productTitle').text());
        ProductObject.brand = $.trim($(page).find('#bylineInfo').text());
        ProductObject.price = cleanPrice($.trim($(page).find('#priceblock_ourprice').text()));
        ProductObject.image = $(page).find('#imgTagWrapperId').find('img').attr("src");
        titleText.value = ProductObject.name;
        brandText.value = ProductObject.brand;
        priceText.value = ProductObject.price;
        imageText.innerText = ProductObject.image;
        imageObject.src = ProductObject.image;

        //need to optimise
        if (productCountry === "es_ES"){
            ProductObject.amazon_link = "https://amazon.es/gp/product/"+productCode
            ProductObject.currency = "EUR";
            amazonLink.value = ProductObject.amazon_link
            amazonCountry.innerText = "Spain";
        }else if (productCountry === "de_DE"){
            ProductObject.amazon_link = "https://amazon.de/gp/product/"+productCode
            ProductObject.currency = "EUR";
            amazonLink.value = ProductObject.amazon_link
            amazonCountry.innerText = "Germany";
        }else if (productCountry === "it_IT"){
            ProductObject.amazon_link = "https://amazon.it/gp/product/"+productCode
            ProductObject.currency = "EUR";
            amazonLink.value = ProductObject.amazon_link
            amazonCountry.innerText = "Italy";
        }else if (productCountry === "en_GB"){
            ProductObject.amazon_link = "https://amazon.co.uk/gp/product/"+productCode
            ProductObject.currency = "GBP";
            amazonLink.value = ProductObject.amazon_link
            amazonCountry.innerText = "United Kingdom";
        }else if (productCountry === "en_US"){
            ProductObject.amazon_link = "https://amazon.com/gp/product/"+productCode
            ProductObject.currency = "USD";
            amazonLink.value = ProductObject.amazon_link
            amazonCountry.innerText = "United States";
        } 

        titleText.onkeyup = function() { ProductObject.name = this.value; }
        brandText.onkeyup = function() { ProductObject.brand = this.value; }
        priceText.onkeyup = function() { ProductObject.price = this.value; }
        codeText.onkeyup = function() { 
          productCode = this.value;  
          if (productCountry === "es_ES"){
              ProductObject.amazon_link = "https://amazon.es/gp/product/"+productCode
              amazonLink.value = ProductObject.amazon_link
          }else if (productCountry === "de_DE"){
              ProductObject.amazon_link = "https://amazon.de/gp/product/"+productCode
              amazonLink.value = ProductObject.amazon_link
          }else if (productCountry === "it_IT"){
              ProductObject.amazon_link = "https://amazon.it/gp/product/"+productCode
              amazonLink.value = ProductObject.amazon_link
          }else if (productCountry === "en_GB"){
              ProductObject.amazon_link = "https://amazon.co.uk/gp/product/"+productCode
              amazonLink.value = ProductObject.amazon_link
          }else if (productCountry === "en_US"){
              ProductObject.amazon_link = "https://amazon.com/gp/product/"+productCode
              amazonLink.value = ProductObject.amazon_link
          }
        }
        amazonLink.onkeyup = function() { ProductObject.amazon_link = this.value; }
        addToKidada.onclick = function(){
            document.getElementById('main').style.display = 'none';
            document.getElementById('result').style.display = 'block';
            document.getElementById('result-text').innerHTML = '<p>loading...</p>';
            saveFile();
        }
    }
  });
  
  function onWindowLoad() {

    firebase.auth().signInWithEmailAndPassword('admin@camberi.com', 'pwd12345Aa!').then(function(user) {
        console.log('User connected', user);
      }).catch(function(error) {
        console.error('Anonymous Sign In Error', error);
      });
  
    var message = document.querySelector('#message');
  
    chrome.tabs.executeScript(null, {
      file: "getPagesSource.js"
    }, function() {
      // If you try and inject into an extensions page or the webstore/NTP you'll get an error
      if (chrome.runtime.lastError) {
        message.innerText = 'There was an error injecting script : \n' + chrome.runtime.lastError.message;
      }
    });
  
  }


    // Download a file form a url.
 function saveFile() {
    // Get file name from url.
     var url = ProductObject.image;
     var filename = url.substring(url.lastIndexOf("/") + 1).split("?")[0];
     var xhr = new XMLHttpRequest();
       xhr.addEventListener("load", transferComplete);
       xhr.addEventListener("error", transferFailed);
       xhr.addEventListener("abort", transferCanceled);
   
     xhr.responseType = 'blob';
     xhr.onload = function() {
       var a = document.createElement('a');
       a.href = window.URL.createObjectURL(xhr.response); // xhr.response is a blob
       a.download = filename; // Set the file name.
       a.style.display = 'none';
       document.body.appendChild(a);
       a.click();
       delete a;
   
             if (this.status === 200) {
           // `blob` response
           console.log(this.response);
           var reader = new FileReader();
           reader.onload = function(e) {
   
           var auth = firebase.auth();
           var storageRef = firebase.storage().ref();

           var metadata = {
            'contentType': 'image/jpeg'
           };

            var file = e.target.result;
            var base64result = reader.result.split(',')[1];
            var blob = b64toBlob(base64result);
            var uploadTask = storageRef.child('products/' + productCode + '.jpg').put(blob, metadata);
   
            uploadTask.on('state_changed', null, function(error) {
           // [START onfailure]
           console.error('Upload failed:', error);
           // [END onfailure]
            }, function() {
           console.log('Uploaded',uploadTask.snapshot.totalBytes,'bytes.');
           console.log(uploadTask.snapshot.metadata);
           var imageRef = storageRef.child('products/' + productCode + '.jpg');
           imageRef.getDownloadURL().then(function(url) {
                ProductObject.image = url;
                db.collection("sites").doc(productCountry).collection("products").doc(productCode).set(ProductObject)
                .then(function(){
                   console.log("Product Uploaded");
                   document.getElementById('result-text').innerHTML = '<strong>Product Uploaded</strong>';
                })
                .catch(function(error){
                    console.log(error);
                });
              });
           })
           .catch(function(error){
               console.log("image load error" + error);
           })
           
         
               // `data-uri`
   
           };
           reader.readAsDataURL(this.response);        
       };
     };
   
   
   
     xhr.open('GET', url);
     xhr.send();
   }
   
   function b64toBlob(b64Data, contentType, sliceSize) {
     contentType = contentType || '';
     sliceSize = sliceSize || 512;
   
     var byteCharacters = atob(b64Data);
     var byteArrays = [];
   
     for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
       var slice = byteCharacters.slice(offset, offset + sliceSize);
   
       var byteNumbers = new Array(slice.length);
       for (var i = 0; i < slice.length; i++) {
         byteNumbers[i] = slice.charCodeAt(i);
       }
   
       var byteArray = new Uint8Array(byteNumbers);
       byteArrays.push(byteArray);
     }
   
     var blob = new Blob(byteArrays, {type: contentType});
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
