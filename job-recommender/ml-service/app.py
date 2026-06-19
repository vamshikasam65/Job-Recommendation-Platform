import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
CORS(app)

# Helper function to tokenize skills (handles multi-word and special character languages like C++, C#, .NET)
def skill_tokenizer(text):
    if not text:
        return []
    # If there are no commas, split by whitespace as a fallback
    raw_tokens = text.split(',') if ',' in text else text.split()
    tokens = []
    for token in raw_tokens:
        clean_token = token.strip().lower()
        if clean_token:
            tokens.append(clean_token)
    return tokens

# Load the jobs dataset on startup
JOBS_FILE = os.path.join(os.path.dirname(__file__), 'jobs.json')
try:
    with open(JOBS_FILE, 'r') as f:
        jobs_db = json.load(f)
except Exception as e:
    print(f"Error loading jobs.json: {e}")
    jobs_db = []

# Load the learning paths database on startup
LEARNING_PATHS_FILE = os.path.join(os.path.dirname(__file__), 'learning_paths.json')
try:
    with open(LEARNING_PATHS_FILE, 'r') as f:
        learning_paths_db = json.load(f)
except Exception as e:
    print(f"Error loading learning_paths.json: {e}")
    learning_paths_db = {}

# Pre-compile the TF-IDF vocabulary based on all skills in the job database
job_skills_corpus = [job['required_skills'] for job in jobs_db]

# Initialize and fit TF-IDF vectorizer using our custom skill tokenizer
vectorizer = TfidfVectorizer(tokenizer=skill_tokenizer, token_pattern=None, lowercase=True)

if job_skills_corpus:
    job_tfidf_matrix = vectorizer.fit_transform(job_skills_corpus)
else:
    job_tfidf_matrix = None

@app.route('/predict', methods=['POST'])
def predict():
    """
    API endpoint that accepts user skills and returns top 5 matched jobs.
    Expects JSON: { "skills": "Python, Flask, Docker" }
    """
    data = request.get_json()
    if not data or 'skills' not in data:
        return jsonify({"error": "Invalid request. Please provide 'skills' in the request body."}), 400

    user_skills_input = data['skills'].strip()
    if not user_skills_input:
        return jsonify({"error": "Skills field cannot be empty."}), 400

    if not jobs_db or job_tfidf_matrix is None:
        return jsonify({"error": "Job database is empty or uninitialized."}), 500

    # Tokenize user skills
    user_skills_list = skill_tokenizer(user_skills_input)
    user_skills_set = set(user_skills_list)

    # Check for unrecognized skills against fitted vectorizer vocabulary
    vocab = set(vectorizer.vocabulary_.keys()) if vectorizer and hasattr(vectorizer, 'vocabulary_') else set()
    
    valid_skills = []
    unrecognized_skills = []
    for skill in user_skills_list:
        if skill in vocab:
            valid_skills.append(skill)
        else:
            unrecognized_skills.append(skill)

    if not valid_skills:
        # All entered skills are wrong/unrecognized
        unrecognized_str = ", ".join([f"'{s}'" for s in unrecognized_skills])
        return jsonify({
            "error": f"None of the skills you entered ({unrecognized_str}) are recognized in our system. Please check your spelling or try common developer skills."
        }), 400

    warning_msg = ""
    if unrecognized_skills:
        unrecognized_str = ", ".join([f"'{s}'" for s in unrecognized_skills])
        warning_msg = f"The following entered skills were not recognized and ignored: {unrecognized_str}"


    # Transform user input into TF-IDF vector
    user_tfidf = vectorizer.transform([user_skills_input])

    # Calculate cosine similarity against all jobs
    similarities = cosine_similarity(user_tfidf, job_tfidf_matrix).flatten()

    # Match results with original job entries
    results = []
    for idx, score in enumerate(similarities):
        job = jobs_db[idx]
        
        # Calculate matching and missing skills with original case preservation
        job_skills_list = [s.strip() for s in job['required_skills'].split(',') if s.strip()]
        matched = []
        missing = []
        for skill in job_skills_list:
            if skill.lower() in user_skills_set:
                matched.append(skill)
            else:
                missing.append(skill)

        # Convert score to percentage
        match_percentage = round(float(score) * 100)

        # Compile learning path suggestions based on missing skills (deduplicated)
        paths = []
        seen_paths = set()
        for s in missing:
            skill_key = s.lower()
            if skill_key in learning_paths_db:
                for path in learning_paths_db[skill_key]:
                    if path not in seen_paths:
                        seen_paths.add(path)
                        paths.append(path)

        results.append({
            "title": job['title'],
            "required_skills": job['required_skills'],
            "description": job['description'],
            "score": match_percentage,
            "matched_skills": matched,
            "missing_skills": missing,
            "learning_paths": paths
        })

    # Sort jobs by matching percentage in descending order
    results.sort(key=lambda x: x['score'], reverse=True)

    # Return top 5 recommendations
    top_recommendations = results[:5]

    return jsonify({
        "recommendations": top_recommendations,
        "warning": warning_msg
    })

if __name__ == '__main__':
    # Run Flask server locally on port 5005 to avoid macOS port 5000 AirPlay conflict
    app.run(debug=True, host='0.0.0.0', port=5005)
