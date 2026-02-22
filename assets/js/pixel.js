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


// --- ViewContent after 7 seconds ---
setTimeout(function () {
  if (typeof fbq === 'function') {
    fbq('trackCustom', 'ViewContent_7s', {
      page_path: window.location.pathname
    });
  }
}, 7000);


// --- Click tracking ---
document.addEventListener("DOMContentLoaded", function () {

  document.querySelectorAll("a").forEach(function(link) {

    link.addEventListener("click", function() {

      const href = link.getAttribute("href");
      if (!href || typeof fbq !== "function") return;

      // --- Telegram = Lead ---
      if (href.includes("t.me")) {
        fbq('track', 'Lead', {
          source: 'telegram',
          page_path: window.location.pathname
        });
      }

      // --- Email = Lead ---
      if (href.startsWith("mailto:")) {
        fbq('track', 'Lead', {
          source: 'email',
          page_path: window.location.pathname
        });
      }

      // --- GPT Agent open (exclude /gpt/ hub) ---
      if (href.startsWith("/gpt/") && href !== "/gpt/") {

        const agentName = href
          .replace('/gpt/', '')
          .replace(/\//g, '');

        fbq('trackCustom', 'AgentOpen', {
          agent: agentName,
          page_path: window.location.pathname
        });
      }

    });

  });

});