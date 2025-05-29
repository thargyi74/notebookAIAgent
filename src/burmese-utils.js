class BurmeseTextProcessor {
    constructor() {
        this.burmeseRange = /[\u1000-\u109F\uAA60-\uAA7F]/g;
        
        this.vowelSigns = /[\u102D-\u1030\u1032\u1033-\u1035]/g;
        this.consonantSigns = /[\u1031\u1036-\u1037\u1039\u103A-\u103F]/g;
        this.punctuation = /[\u104A-\u104F]/g;
        this.numberSigns = /[\u1040-\u1049]/g;
        
        this.expandedSynonymMap = {
            'မြန်မာ': ['ဗမာ', 'မြန်မာနိုင်ငံ', 'မြန်မာပြည်', 'မြန်မာ့', 'ဗမာ့', 'ဗမာပြည်'],
            'ရန်ကုန်': ['ရန်ကုန်မြို့', 'ရန်ကုန်တိုင်း', 'ရန်ကုန်', 'ရန်ကုန်မြို့တော်'],
            'မန္တလေး': ['မန္တလေးမြို့', 'မန္တလေးတိုင်း', 'မန္တလေး', 'မန္တလေးမြို့တော်'],
            'နေပြည်တော်': ['နေပြည်တော်မြို့', 'နေပြည်တော်ကောင်စီနယ်မြေ', 'နေပြည်တော်', 'နပိတော်'],
            'နိုင်ငံ': ['နိုင်ငံတော်', 'နိုင်ငံ', 'ပြည်', 'ပြည်တော်'],
            'မြို့': ['မြို့တော်', 'မြို့နယ်', 'မြို့', 'နယ်'],
            'အစိုးရ': ['နိုင်ငံတော်', 'ပြည်ထောင်စု', 'အစိုးရ', 'အုပ်ချုပ်ရေး'],
            'ပညာ': ['ပညာရေး', 'ပညာ', 'သင်တန်း', 'ပညာသင်ကြား'],
            'ကျန်းမာရေး': ['ကျန်းမာ', 'ကုသ', 'ဆေးကု', 'ဆေးရုံ', 'အထူးကု'],
            'စီးပွားရေး': ['စီးပွား', 'စီးပွားကူး', 'စီးပွားလုပ်ငန်း', 'စီးပွားရေး', 'ကုန်သွယ်ရေး'],
            'ယဉ်ကျေးမှု': ['ယဉ်ကျေး', 'ဓလေ့', 'ပြဿနာ', 'ရိုးရာ', 'ယဉ်ကျေးမှု'],
            'သတင်းစာ': ['သတင်း', 'သတင်းစာ', 'ဂျာနယ်', 'မီဒီယာ'],
            'နည်းပညာ': ['နည်းပညာ', 'သိပ္ပံ', 'နည်းပညာဆိုင်ရာ', 'နည်းပညာရေး']
        };
        
        this.phoneticSimilarityMap = {
            'က': ['ခ'],
            'ဂ': ['ဃ'],
            'စ': ['ဆ'],
            'ဇ': ['ဈ'],
            'တ': ['ထ'],
            'ဒ': ['ဓ'],
            'န': ['ဏ'],
            'ပ': ['ဖ'],
            'ဗ': ['ဘ'],
            'မ': ['မ်'],
            'ယ': ['ရ'],
            'လ': ['ဠ'],
            'သ': ['ဿ'],
            'အ': ['အံ']
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
        
        const advancedSyllablePattern = /[\u1000-\u1021](?:[\u102D-\u1030\u1032-\u1035]|[\u1031\u1036-\u1037\u1039\u103A-\u103F])*(?:\u103A[\u1000-\u1021](?:[\u102D-\u1030\u1032-\u1035]|[\u1031\u1036-\u1037\u1039\u103A-\u103F])*)*(?:[\u1000-\u1021][\u1039][\u1000-\u1021])*|[\u1040-\u1049]+|\S/g;
        
        const tokens = normalized.match(advancedSyllablePattern) || [];
        
        return tokens.filter(token => token.trim().length > 0);
    }

    expandSynonyms(searchTerm) {
        const expanded = [searchTerm];
        
        for (const [key, synonyms] of Object.entries(this.expandedSynonymMap)) {
            if (searchTerm.includes(key)) {
                synonyms.forEach(synonym => {
                    expanded.push(searchTerm.replace(key, synonym));
                });
            }
        }
        
        this.generatePhoneticVariants(searchTerm).forEach(variant => {
            expanded.push(variant);
        });
        
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

    generatePhoneticVariants(text) {
        const variants = [];
        const tokens = this.tokenize(text);
        
        tokens.forEach(token => {
            if (token.length > 0) {
                const firstChar = token.charAt(0);
                if (this.phoneticSimilarityMap[firstChar]) {
                    this.phoneticSimilarityMap[firstChar].forEach(similar => {
                        variants.push(token.replace(firstChar, similar));
                    });
                }
            }
        });
        
        return variants;
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
        
        let jaccardScore = intersection.size / union.size;
        
        let phoneticScore = 0;
        const phonetic1 = this.generatePhoneticVariants(normalized1);
        const phonetic2 = this.generatePhoneticVariants(normalized2);
        
        phonetic1.forEach(variant1 => {
            phonetic2.forEach(variant2 => {
                if (variant1 === variant2) {
                    phoneticScore = Math.max(phoneticScore, 0.8);
                }
            });
        });
        
        let partialScore = 0;
        if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
            partialScore = 0.6;
        }
        
        return Math.max(jaccardScore, phoneticScore, partialScore);
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