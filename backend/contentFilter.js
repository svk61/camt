const fs = require('fs');
const path = require('path');

// Load filter keywords
let filterKeywords = null;

function loadFilterKeywords() {
    if (filterKeywords) return filterKeywords;

    try {
        const filePath = path.join(__dirname, 'contentFilter.json');
        const data = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(data);
        filterKeywords = parsed.hegemonic_filter_keywords;
        console.log('✅ Content filter loaded successfully');
        return filterKeywords;
    } catch (error) {
        console.error('❌ Failed to load content filter:', error.message);
        return null;
    }
}

// Get all keywords as a flat array
function getAllKeywords() {
    const keywords = loadFilterKeywords();
    if (!keywords) return [];

    const allKeywords = [];
    for (const category of Object.values(keywords)) {
        allKeywords.push(...category);
    }
    return allKeywords;
}

// Normalize Turkish characters for matching
function normalizeText(text) {
    return text
        .toLowerCase()
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^\w\s]/g, '') // Remove special characters
        .trim();
}

// Check if message contains filtered content
function checkMessage(message) {
    if (!message || typeof message !== 'string') {
        return { isClean: true, detectedWords: [], category: null };
    }

    const keywords = loadFilterKeywords();
    if (!keywords) {
        return { isClean: true, detectedWords: [], category: null };
    }

    const normalizedMessage = normalizeText(message);
    const detectedWords = [];
    let detectedCategory = null;

    for (const [category, words] of Object.entries(keywords)) {
        for (const word of words) {
            const normalizedWord = normalizeText(word);

            // Check for exact word match or as part of message
            const wordRegex = new RegExp(`\\b${normalizedWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');

            if (wordRegex.test(normalizedMessage) || normalizedMessage.includes(normalizedWord)) {
                detectedWords.push(word);
                if (!detectedCategory) {
                    detectedCategory = category;
                }
            }
        }
    }

    return {
        isClean: detectedWords.length === 0,
        detectedWords,
        category: detectedCategory
    };
}

// Get user-friendly category name
function getCategoryDisplayName(category) {
    const names = {
        'kufur_ve_agır_hakaret': 'Küfür ve Ağır Hakaret',
        'duygusal_bastirma': 'Duygusal Bastırma',
        'toksik_maskulenlik_performansi': 'Toksik Maskülenlik',
        'akademik_ve_akran_zorbaligi': 'Akran Zorbalığı',
        'cinsiyetci_stereotipler': 'Cinsiyetçi İfadeler',
        'hegemonik_dislama': 'Hegemonik Dışlama'
    };
    return names[category] || category;
}

// Get warning message for blocked content
function getWarningMessage(category) {
    const messages = {
        'kufur_ve_agır_hakaret': 'Mesajınız küfür veya hakaret içeriyor. Lütfen saygılı bir dil kullanın.',
        'duygusal_bastirma': 'Mesajınız duygusal bastırma ifadeleri içeriyor. Bu toplulukta herkesin duyguları değerlidir.',
        'toksik_maskulenlik_performansi': 'Mesajınız toksik maskülenlik ifadeleri içeriyor. Herkese eşit davranmayı destekliyoruz.',
        'akademik_ve_akran_zorbaligi': 'Mesajınız zorbalık ifadeleri içeriyor. Saygılı bir ortam için lütfen dilinize dikkat edin.',
        'cinsiyetci_stereotipler': 'Mesajınız cinsiyetçi ifadeler içeriyor. Toplumsal cinsiyete dayalı ayrımcılığa karşıyız.',
        'hegemonik_dislama': 'Mesajınız dışlayıcı ifadeler içeriyor. Bu toplulukta herkes değerlidir.'
    };
    return messages[category] || 'Mesajınız uygunsuz içerik içeriyor. Lütfen topluluk kurallarına uyun.';
}

module.exports = {
    checkMessage,
    getAllKeywords,
    getCategoryDisplayName,
    getWarningMessage,
    loadFilterKeywords
};
