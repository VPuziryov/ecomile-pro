// Meta Pixel init
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');

fbq('init', '1403441134581587');
fbq('track', 'PageView');

// ViewContent after 7 seconds
setTimeout(function () {
  if (typeof fbq === 'function') {
    fbq('trackCustom', 'ViewContent_7s', {
      content_name: document.body.dataset.content || 'unknown',
      page_path: window.location.pathname
    });
  }
}, 7000);
