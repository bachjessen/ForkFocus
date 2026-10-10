/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

const keyWords = [
  "Voorgestel vir jou",
  "اقتراحات قد تعجبك",
  "Návrhy pro vás",
  "Foreslået til dig",
  "Für dich vorgeschlagen",
  "Προτείνονται για εσάς",
  "Suggested for you",
  "Suggested post",
  "Sugerencia para ti",
  "پیشنهادشده برای شما",
  "Sinulle ehdotettua",
  "Suggestions pour vous",
  "הצעות בשבילך",
  "Disarankan untuk Anda",
  "Suggeriti per te",
  "おすすめ",
  "회원님을 위한 추천",
  "Dicadangkan untuk anda",
  "Foreslått for deg",
  "Aanbevolen voor jou",
  "Propozycje dla Ciebie",
  "Sugestões para você",
  "Sugestões para ti",
  "Рекомендации для вас",
  "Förslag för dig",
  "แนะนำสำหรับคุณ",
  "Sina-suggest para sa iyo",
  "Senin için önerilenler",
  "为你推荐",
  "為你推薦",
  "আপনার জন্য প্রস্তাবিত",
  "તમારા માટે સૂચવેલું",
  "आपके लिए सुझाई गई",
  "Predloženo za vas",
  "Neked javasoltak",
  "ನಿಮಗಾಗಿ ಸಲಹೆ ನೀಡಲಾಗಿದೆ",
  "നിങ്ങൾക്കായി നിർദ്ദേശിച്ചത്",
  "तुमच्यासाठी सुचवलेली",
  "तपाईंका लागि सिफारिस गरिएको",
  "ਤੁਹਾਡੇ ਲਈ ਸੁਝਾਏ ਗਏ",
  "ඔබ සඳහා යෝජිත",
  "Návrhy pre vás",
  "உங்களுக்காகப் பரிந்துரைக்கப்பட்டவை",
  "మీ కోసం సూచించబడినవి",
  "آپ کیلئے تجویز کردہ",
  "Gợi ý cho bạn",
  "為你推薦",
  "Предложено за вас",
  "Suggestions pour vous",
  "Sugestii pentru tine",
  "Предлажемо за вас",
  "Рекомендовано для вас",
];

const instagramRuntimeScope = SocialFocusContentRuntime.createLifecycleScope({ featureId: "instagramSuggestedPosts" });
const suggestedPostsObserver = new MutationObserver(() => {
  const suggestedPostsArticle = [...document.querySelectorAll("article > div")].filter((article) =>
    [...article.querySelectorAll("span")].some((span) => keyWords.includes(span.textContent.trim())),
  );
  suggestedPostsArticle.forEach((item) => item.setAttribute("suggestedPost", "true"));
});

function hideSuggestedPostInstagram(value) {
  if (value) {
    instagramRuntimeScope.interval("wait-for-main", () => {
      const main = document.querySelector('main[role="main"]');
      if (main) {
        instagramRuntimeScope.cancel("interval", "wait-for-main");
        instagramRuntimeScope.observe("suggested-posts", suggestedPostsObserver, main, {
          childList: true,
          subtree: true,
        });
      }
    }, 100);
  } else {
    instagramRuntimeScope.cancel("interval", "wait-for-main");
    instagramRuntimeScope.cancel("observer", "suggested-posts");

    document.querySelectorAll("[suggestedPost]").forEach((item) => {
      item.removeAttribute("suggestedPost");
    });
  }
}

instagramRuntimeScope.listen("pagehide", window, "pagehide", () => instagramRuntimeScope.dispose(), { once: true });
