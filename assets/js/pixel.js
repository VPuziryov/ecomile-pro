// ======================================================
// ECOMILE Pixel v2
// ======================================================

// Meta Pixel init
!function(f,b,e,v,n,t,s)
{
if(f.fbq)return;
n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;
n.push=n;
n.loaded=!0;
n.version='2.0';
n.queue=[];
t=b.createElement(e);
t.async=!0;
t.src=v;
s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s);

}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');

fbq('init','1403441134581587');
fbq('track','PageView');



// ======================================================
// Page mapping
// ======================================================

const body=document.body;

const page=body.dataset.page || "";

const events={

    // ECOMILE

"ecomile-home":{
view:"ViewContent_Ecomile_Home_7s"
},

// EasyAds

"easyads":{
view:"ViewContent_EasyAds_7s"
},

"easyads-pricing":{
view:"ViewContent_EasyAds_Pricing_7s"
},

"easyads-contact":{
view:"ViewContent_EasyAds_Contact_7s",
telegram:"Click_Telegram_EasyAds",
messenger:"Click_Messenger_EasyAds",
lead:"Lead_Form_EasyAds"
},

// EasyAds Asia

"easyads-asia":{
view:"ViewContent_EasyAds_Asia_7s"
},

"easyads-asia-pricing":{
view:"ViewContent_EasyAds_Asia_Pricing_7s"
},

"easyads-asia-contact":{
view:"ViewContent_EasyAds_Asia_Contact_7s",
telegram:"Click_Telegram_EasyAds_Asia",
messenger:"Click_Messenger_EasyAds_Asia",
lead:"Lead_Form_EasyAds_Asia"
},

// DiveAds

"diveads":{
view:"ViewContent_DiveAds_7s"
},

"diveads-pricing":{
view:"ViewContent_DiveAds_Pricing_7s"
},

"diveads-contact":{
    view:"ViewContent_DiveAds_Contact_7s",
    telegram:"Click_Telegram_DiveAds",
    messenger:"Click_Messenger_DiveAds",
    lead:"Lead_Form_DiveAds"
},

};



// ======================================================
// 7 seconds ViewContent
// ======================================================

if(events[page]){

setTimeout(function(){

fbq(
'trackCustom',
events[page].view
);

},7000);

}



// ======================================================
// Click tracking
// ======================================================

document.addEventListener("DOMContentLoaded",function(){

document.querySelectorAll("a").forEach(function(link){

link.addEventListener("click",function(e){

const href=link.getAttribute("href");

if(!href)return;

if(!events[page])return;



// Telegram

if(
    href.includes("t.me") ||
    href.includes("telegram.me")
){

    e.preventDefault();

    fbq(
        'trackCustom',
        events[page].telegram
    );

    setTimeout(function(){

        window.open(
            href,
            "_blank",
            "noopener"
        );

    },150);

    return;

}



// Messenger

if(
href.includes("m.me") ||
href.includes("messenger.com")
){

e.preventDefault();

fbq(
'trackCustom',
events[page].messenger
);

setTimeout(function(){

window.open(
href,
"_blank",
"noopener"
);

},150);

return;

}



});

});

});
// ======================================================
// Lead
// ======================================================

window.trackLead=function(){

if(!events[page]) return;

if(!events[page].lead) return;

fbq(
'trackCustom',
events[page].lead
);

};