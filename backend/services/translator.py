# services/translator.py
translations = {
    "en": {
        "normal": "Stress levels are normal. Keep up the good work!",
        "high": "High stress detected. Try a 5-minute breathing exercise or enjoy some traditional herbal tea."
    },
    "am": {
        "normal": "የጭንቀት መጠኖ ተገቢ ነው። ጠንክረህ ቀጥልበት!",
        "high": "ከፍተኛ ጭንቀት ታይቷል። ለ 5 ደቂቃ በጥልቀት መተንፈስ ወይም ባህላዊ ሻይ መውሰድ ይሞክሩ።"
    }
}

def get_tip(status: str, lang: str = "en"):
    lang_data = translations.get(lang, translations["en"])
    return lang_data.get(status, lang_data["normal"])