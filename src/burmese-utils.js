class BurmeseTextProcessor {
    constructor() {
        this.burmeseRange = /[\u1000-\u109F\uAA60-\uAA7F]/g;
        
        this.vowelSigns = /[\u102D-\u1030\u1032]/g;
        this.consonantSigns = /[\u1031\u1036-\u1037\u1039\u103A]/g;
        this.numberSigns = /[\u1040-\u1049]/g;
        
        this.synonymMap = {
            'မြန်မာ': ['ဗမာ', 'မြန်မာနိုင်ငံ', 'မြန်မာပြည်'],
            'ရန်ကုန်': ['ရန်ကုန်မြို့', 'ရန်ကုန်တိုင်း'],
            'မန္တလေး': ['မန္တလေးမြို့', 'မန္တလေးတိုင်း'],
            'နေပြည်တော်': ['နေပြည်တော်မြို့', 'နေပြည်တော်ကောင်စီနယ်မြေ']
        };
    }

    isBurmese(text) {
        return this.burmeseRange.test(text);
    }

    cleanText(text) {
        if (!text) return '';
        
        return text
            .replace(/[\u200B-\u200D\uFEFF]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    normalizeText(text) {
        if (!text) return '';
        
        let normalized = this.cleanText(text);
        
        const normalizations = {
            'ြ': 'ြ',
            'ွ': 'ွ', 
            'ေ': 'ေ',
            'း': 'း',
            '့': '့',
            '္': '္'
        };
        
        for (const [incorrect, correct] of Object.entries(normalizations)) {
            normalized = normalized.replace(new RegExp(incorrect, 'g'), correct);
        }
        
        return normalized;
    }

    tokenize(text) {
        if (!text) return [];
        
        const normalized = this.normalizeText(text);
        
        const syllablePattern = /[\u1000-\u1021](?:[\u102D-\u1030\u1032]|[\u1036-\u1037\u1039\u103A])*(?:\u103A[\u1000-\u1021](?:[\u102D-\u1030\u1032]|[\u1036-\u1037\u1039\u103A])*)*|\S/g;
        
        return normalized.match(syllablePattern) || [];
    }

    expandSynonyms(searchTerm) {
        const expanded = [searchTerm];
        
        for (const [key, synonyms] of Object.entries(this.synonymMap)) {
            if (searchTerm.includes(key)) {
                synonyms.forEach(synonym => {
                    expanded.push(searchTerm.replace(key, synonym));
                });
            }
        }
        
        return [...new Set(expanded)];
    }

    createSearchVariants(text) {
        if (!text) return [];
        
        const variants = [];
        const normalizedText = this.normalizeText(text);
        
        variants.push(normalizedText);
        
        variants.push(...this.expandSynonyms(normalizedText));
        
        const tokens = this.tokenize(normalizedText);
        if (tokens.length > 1) {
            tokens.forEach(token => {
                if (token.length > 1) {
                    variants.push(token);
                }
            });
        }
        
        return [...new Set(variants)];
    }

    calculateSimilarity(text1, text2) {
        if (!text1 || !text2) return 0;
        
        const normalized1 = this.normalizeText(text1);
        const normalized2 = this.normalizeText(text2);
        
        if (normalized1 === normalized2) return 1;
        
        const tokens1 = this.tokenize(normalized1);
        const tokens2 = this.tokenize(normalized2);
        
        const set1 = new Set(tokens1);
        const set2 = new Set(tokens2);
        
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        
        return intersection.size / union.size;
    }

    highlightMatches(text, searchTerm) {
        if (!text || !searchTerm) return text;
        
        const variants = this.createSearchVariants(searchTerm);
        let highlighted = text;
        
        variants.forEach(variant => {
            const regex = new RegExp(variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            highlighted = highlighted.replace(regex, `**$&**`);
        });
        
        return highlighted;
    }
}

export default BurmeseTextProcessor;