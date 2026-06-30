import * as fs from 'fs';

const data = fs.readFileSync('src/data.ts', 'utf-8');

let updatedData = data;

const topicPronunciations: Record<string, string> = {
  "t_a1_1": "nationality: /ˌnæʃəˈnæləti/",
  "t_a1_2": "barista: /bəˈriːstə/",
  "t_a2_1": "grocery: /ˈɡroʊsəri/",
  "t_time": "excuse: /ɪkˈskjuːz/",
  "t_simple_doctor": "headache: /ˈhɛdˌeɪk/",
  "t_small_talk": "weather: /ˈwɛðər/",
  "t_hobbies": "hobbies: /ˈhɑbiz/",
  "t1": "experience: /ɪkˈspɪriəns/",
  "t2": "representative: /ˌrɛprɪˈzɛntətɪv/",
  "t3": "symptoms: /ˈsɪmptəmz/",
  "t4": "enthusiastic: /ɪnˌθuziˈæstɪk/",
  "t5": "anniversary: /ˌænɪˈvɜrsəri/",
  "t6": "recommendations: /ˌrɛkəmɛnˈdeɪʃənz/",
  "t7": "doppelgänger: /ˈdɑpəlˌɡæŋər/",
  "t8": "anniversary: /ˌænɪˈvɜrsəri/",
  "t_b2_1": "conditionals: /kənˈdɪʃənəlz/",
  "t_c1_1": "appetizer: /ˈæpɪˌtaɪzər/",
  "unit_1": "destination: /ˌdɛstəˈneɪʃən/",
  "unit_2": "particular: /pərˈtɪkjələr/",
  "unit_3": "skeptical: /ˈskɛptɪkəl/",
  "unit_4": "negotiate: /nɪˈɡoʊʃiˌeɪt/",
  "unit_5": "beachfront: /ˈbitʃˌfrʌnt/",
  "unit_6": "luncheon: /ˈlʌntʃən/",
  "unit_7": "engagement: /ɪnˈɡeɪdʒmənt/",
  "unit_8": "compliment: /ˈkɑmpləmənt/",
  "unit_9": "terminal: /ˈtɜrmənəl/",
  "unit_10": "snorkeling: /ˈsnɔrkəlɪŋ/",
  "syl_emergency": "capsized: /ˈkæpˌsaɪzd/",
  "syl_interview": "hospitality: /ˌhɑspɪˈtæləti/",
  "syl_finance": "fraudulent: /ˈfrɔdʒələnt/",
  "syl_environment": "stewardship: /ˈstuərdˌʃɪp/",
  "syl_news": "biased: /ˈbaɪəst/",
  "syl_problems": "double-booked: /ˈdʌbəl-bʊkt/",
  "syl_future": "sustainable: /səˈsteɪnəbəl/",
  "t_grumpy_guest": "unacceptable: /ˌʌnəkˈsɛptəbəl/",
  "t_cenote_tour": "breathtaking: /ˈbrɛθˌteɪkɪŋ/",
  "t_menu_allergies": "allergy: /ˈælərʤi/",
  "t_beach_club": "spectacular: /spɛkˈtækjələr/",
  "t_taxi_negotiation": "negotiate: /nɪˈɡoʊʃiˌeɪt/"
};

const grammarPronunciations: Record<string, string> = {
  "word_formation": "adjectives: /ˈædʒɪktɪvz/",
  "future_in_past": "intended: /ɪnˈtɛndɪd/",
  "spelling_punctuation": "punctuation: /ˌpʌŋktʃuˈeɪʃən/",
  "present_tenses": "progressive: /prəˈɡrɛsɪv/",
  "past_and_perfect": "perfect: /ˈpɜrfɪkt/",
  "prepositions_idioms": "prepositions: /ˌprɛpəˈzɪʃənz/",
  "phrasal_verbs": "phrasal: /ˈfreɪzəl/",
  "modal_verbs": "auxiliary: /ɔɡˈzɪljəri/",
  "comparisons": "comparative: /kəmˈpɛrətɪv/",
  "connecting_ideas": "interrogative: /ˌɪntəˈrɑɡətɪv/",
  "idiomatic_expressions": "idiomatic: /ˌɪdiəˈmætɪk/",
  "causatives": "causative: /ˈkɔzətɪv/",
  "gerunds_infinitives": "gerunds: /ˈdʒɛrəndz/",
  "future_forms": "progressive: /prəˈɡrɛsɪv/"
};

// Update TOPICS
const topicsRegex = /(id:\s*"([^"]+)",[\s\S]*?vocabulary:\s*\[[^\]]+\])(\s*\})/g;
updatedData = updatedData.replace(topicsRegex, (match, p1, id, p2) => {
  const pronun = topicPronunciations[id] || "example: /ɪɡˈzæmpəl/";
  return `${p1},\n    pronunciation: "${pronun}"${p2}`;
});

// Update GRAMMAR_TOPICS
const grammarRegex = /(id:\s*"([^"]+)",[\s\S]*?vocabulary:\s*\[[^\]]+\])(\s*\})/g;
updatedData = updatedData.replace(grammarRegex, (match, p1, id, p2) => {
  const pronun = grammarPronunciations[id] || "example: /ɪɡˈzæmpəl/";
  return `${p1},\n    pronunciation: "${pronun}"${p2}`;
});

fs.writeFileSync('src/data.ts', updatedData, 'utf-8');
console.log('Successfully updated data.ts with TOPICS and GRAMMAR_TOPICS');
