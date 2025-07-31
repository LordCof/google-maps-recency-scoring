// === HEX2DEC ===
function add(x, y, base) {
  var z = [];
  var n = Math.max(x.length, y.length);
  var carry = 0;
  var i = 0;
  while (i < n || carry) {
    var xi = i < x.length ? x[i] : 0;
    var yi = i < y.length ? y[i] : 0;
    var zi = carry + xi + yi;
    z.push(zi % base);
    carry = Math.floor(zi / base);
    i++;
  }
  return z;
}

function multiplyByNumber(num, x, base) {
  if (num < 0) return null;
  if (num == 0) return [];
  var result = [];
  var power = x;
  while (true) {
    if (num & 1) {
      result = add(result, power, base);
    }
    num = num >> 1;
    if (num === 0) break;
    power = add(power, power, base);
  }
  return result;
}

function parseToDigitsArray(str, base) {
  var digits = str.split('');
  var ary = [];
  for (var i = digits.length - 1; i >= 0; i--) {
    var n = parseInt(digits[i], base);
    if (isNaN(n)) return null;
    ary.push(n);
  }
  return ary;
}

function convertBase(str, fromBase, toBase) {
  var digits = parseToDigitsArray(str, fromBase);
  if (digits === null) return null;
  var outArray = [];
  var power = [1];
  for (var i = 0; i < digits.length; i++) {
    if (digits[i]) {
      outArray = add(outArray, multiplyByNumber(digits[i], power, toBase), toBase);
    }
    power = multiplyByNumber(fromBase, power, toBase);
  }
  var out = '';
  for (var i = outArray.length - 1; i >= 0; i--) {
    out += outArray[i].toString(toBase);
  }
  if (out === '') {
    out = '0';
  }
  return out;
}

function hexToDec(hexStr) {
  if (hexStr.substring(0, 2) === '0x') hexStr = hexStr.substring(2);
  hexStr = hexStr.toLowerCase();
  return convertBase(hexStr, 16, 10);
}

// === TYPES ===
const SortEnum = {
    "relevent": 1,
    "newest": 2,
    "highest_rating": 3,
    "lowest_rating": 4
};

// === LISTUGCPOSTS ===
function listugcposts(url, so, pg = "", sq = "") {
    const m = [...url.matchAll(/!1s([a-zA-Z0-9_:]+)!/g)];
    if (!m || !m[0][1]) {
        throw new Error("Invalid URL");
    }
    const placeId = m[1]?.[1] ? m[1][1] : m[0][1];
    return `https://www.google.com/maps/rpc/listugcposts?authuser=0&hl=en&gl=in&pb=!1m7!1s${placeId}!3s${sq}!6m4!4m1!1e1!4m1!1e3!2m2!1i10!2s${pg}!5m2!1sBnOwZvzePPfF4-EPy7LK0Ak!7e81!8m5!1b1!2b1!3b1!5b1!7b1!11m6!1e3!2e1!3sen!4slk!6m1!1i2!13m1!1e${so}`;
}

// === UTILS ===
function validateParams(url, sort_type, pages, clean) {
    const parsedUrl = new URL(url);
    if (parsedUrl.host !== "www.google.com" || !parsedUrl.pathname.startsWith("/maps/place/")) {
        throw new Error(`Invalid URL: ${url}`);
    }
    if (!SortEnum[sort_type]) {
        throw new Error(`Invalid sort type: ${sort_type}`);
    }
    if (pages !== "max" && isNaN(pages)) {
        throw new Error(`Invalid pages value: ${pages}`);
    }
    if (typeof clean !== "boolean") {
        throw new Error(`Invalid value for 'clean': ${clean}`);
    }
}

async function fetchReviews(url, sort, nextPage = "", search_query = "") {
    const apiUrl = listugcposts(url, sort, nextPage, search_query);
    const response = await fetch(apiUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch reviews: ${response.statusText}`);
    }
    const textData = await response.text();
    const rawData = textData.split(")]}'")[1];
    return JSON.parse(rawData);
}

// === FONCTION AVEC NOMBRE D'AVIS CUSTOM ===
async function getReviewsRatingAndDateCustom(url, targetReviews) {
    try {
        const maxPages = Math.ceil(targetReviews / 10); // 10 reviews par page environ
        validateParams(url, "newest", maxPages, false);
        const sort = SortEnum["newest"];
        let allReviews = [];
        
        console.log(`🎯 Objectif: ${targetReviews} avis (${maxPages} pages max)`);
        
        // Première page
        const initialData = await fetchReviews(url, sort, "", "");
        if (!initialData || !initialData[2] || !initialData[2].length) {
            return [];
        }
        
        allReviews = [...initialData[2]];
        console.log(`📄 Page 1: ${initialData[2].length} reviews`);
        
        let nextPage = initialData[1]?.replace(/"/g, "");
        let currentPage = 2;
        
        // Pages suivantes jusqu'à atteindre l'objectif
        while (nextPage && allReviews.length < targetReviews && currentPage <= maxPages) {
            console.log(`📄 Scraping page ${currentPage}... (${allReviews.length}/${targetReviews})`);
            
            const data = await fetchReviews(url, sort, nextPage, "");
            if (!data || !data[2] || !data[2].length) break;
            
            allReviews = [...allReviews, ...data[2]];
            console.log(`📄 Page ${currentPage}: ${data[2].length} reviews (total: ${allReviews.length})`);
            
            nextPage = data[1]?.replace(/"/g, "");
            if (!nextPage) break;
            
            // Délai adaptatif selon le nombre de pages
            const delay = currentPage <= 3 ? 500 : 800;
            await new Promise(resolve => setTimeout(resolve, delay));
            currentPage++;
        }
        
        console.log(`✅ Total: ${allReviews.length} reviews récupérées (objectif: ${targetReviews})`);
        
        // Prendre seulement le nombre demandé
        const limitedReviews = allReviews.slice(0, targetReviews);
        
        // Extraire seulement rating et published date
        const reviewsData = limitedReviews.map(([review]) => ({
            rating: review[2][0][0],
            published: review[1][2]
        })).filter(r => r.rating !== null && r.published !== null);
        
        console.log(`📊 Reviews finales: ${reviewsData.length} avis valides`);
        return reviewsData;
        
    } catch (error) {
        console.error('Erreur scraping custom:', error);
        return [];
    }
}

// === FONCTION PRINCIPALE (5 PAGES) ===
async function getReviewsRatingAndDate(url) {
    try {
        validateParams(url, "newest", 5, false);
        const sort = SortEnum["newest"];
        let allReviews = [];
        
        // Première page
        const initialData = await fetchReviews(url, sort, "", "");
        if (!initialData || !initialData[2] || !initialData[2].length) {
            return [];
        }
        
        allReviews = [...initialData[2]];
        console.log(`📄 Page 1: ${initialData[2].length} reviews`);
        
        let nextPage = initialData[1]?.replace(/"/g, "");
        let currentPage = 2;
        
        // Pages suivantes (jusqu'à 5 pages)
        while (nextPage && currentPage <= 5) {
            console.log(`📄 Scraping page ${currentPage}...`);
            
            const data = await fetchReviews(url, sort, nextPage, "");
            if (!data || !data[2] || !data[2].length) break;
            
            allReviews = [...allReviews, ...data[2]];
            console.log(`📄 Page ${currentPage}: ${data[2].length} reviews`);
            
            nextPage = data[1]?.replace(/"/g, "");
            if (!nextPage) break;
            
            // Délai pour éviter le rate limiting
            await new Promise(resolve => setTimeout(resolve, 800));
            currentPage++;
        }
        
        console.log(`✅ Total: ${allReviews.length} reviews récupérées`);
        
        // Extraire seulement rating et published date
        const reviewsData = allReviews.map(([review]) => ({
            rating: review[2][0][0],
            published: review[1][2]
        })).filter(r => r.rating !== null && r.published !== null);
        
        return reviewsData;
        
    } catch (error) {
        console.error('Erreur scraping:', error);
        return [];
    }
}

// Export pour utilisation dans content.js
window.getReviewsRatingAndDate = getReviewsRatingAndDate;
window.getReviewsRatingAndDateCustom = getReviewsRatingAndDateCustom;