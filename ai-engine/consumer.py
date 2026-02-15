import json
import logging
from kafka import KafkaConsumer
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Database Config
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 5432)),
    "database": os.getenv("DB_NAME", "erankup_db"),
    "user": os.getenv("DB_USER", "admin"),
    "password": os.getenv("DB_PASSWORD", "password")
}

# Kafka Config
KAFKA_TOPIC = os.getenv("KAFKA_TOPIC", "test_submission")
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092").split(",")
KAFKA_GROUP_ID = os.getenv("KAFKA_GROUP_ID", "ai-engine-group")

def get_db_connection():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        logger.error(f"Failed to connect to DB: {e}")
        return None

def analyze_performance(answers, model_id):
    conn = get_db_connection()
    if not conn:
        return None

    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # 1. Fetch questions with Chapter and Topic info
        query = """
            SELECT q.id, q."correctOptionId", q.topic, c.title as chapter_title
            FROM question q
            JOIN model m ON q."modelId" = m.id
            JOIN chapter c ON m."chapterId" = c.id
            WHERE m.id = %s
        """
        cur.execute(query, (model_id,))
        questions = cur.fetchall()
        
        # 2. Group performance by chapter and topic
        chapter_stats = {}
        topic_stats = {}
        
        for q in questions:
            ch_title = q['chapter_title']
            tp_title = q['topic'] or "General"
            
            if ch_title not in chapter_stats:
                chapter_stats[ch_title] = {"correct": 0, "total": 0}
            if tp_title not in topic_stats:
                topic_stats[tp_title] = {"correct": 0, "total": 0}
            
            qid = str(q['id'])
            user_ans = answers.get(qid)
            
            chapter_stats[ch_title]["total"] += 1
            topic_stats[tp_title]["total"] += 1
            
            if user_ans == q['correctOptionId']:
                chapter_stats[ch_title]["correct"] += 1
                topic_stats[tp_title]["correct"] += 1
        
        # 3. Generate Recommendations
        recommendations = []
        strengths = []
        weaknesses = []
        
        for ch, stats in chapter_stats.items():
            acc = (stats['correct'] / stats['total']) * 100
            if acc >= 80:
                strengths.append(ch)
            elif acc <= 50:
                weaknesses.append(ch)
                recommendations.append(f"Focus on {ch}: Accuracy is low ({acc:.0f}%). Review Chapter basics.")
        
        # Add topic-specific recommendations if accuracy is particularly low
        for tp, stats in topic_stats.items():
            acc = (stats['correct'] / stats['total']) * 100
            if acc < 40:
                recommendations.append(f"Crucial Improvement needed in Topic: {tp} ({acc:.0f}%).")
        
        if not recommendations and weaknesses:
            recommendations.append("Overall good effort. Focus on improving your speed.")
        elif not recommendations:
            recommendations.append("Excellent work! You are ready for a higher difficulty level.")

        insights = {
            "chapterAnalysis": chapter_stats,
            "topicAnalysis": topic_stats,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "recommendation": recommendations[0] if recommendations else "Keep practicing!"
        }
        
        return insights
        
    except Exception as e:
        logger.error(f"Error during analysis: {e}")
        return None
    finally:
        cur.close()
        conn.close()

def update_attempt_insights(attempt_id, insights):
    conn = get_db_connection()
    if not conn:
        return

    try:
        cur = conn.cursor()
        query = "UPDATE attempt SET insights = %s WHERE id = %s"
        cur.execute(query, (json.dumps(insights), attempt_id))
        conn.commit()
        logger.info(f"Updated insights for Attempt {attempt_id}")
    except Exception as e:
        logger.error(f"Failed to update attempt: {e}")
    finally:
        cur.close()
        conn.close()

def main():
    logger.info("Starting AI Engine Consumer...")
    
    try:
        consumer = KafkaConsumer(
            KAFKA_TOPIC,
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            auto_offset_reset='latest',
            enable_auto_commit=True,
            group_id=KAFKA_GROUP_ID,
            value_deserializer=lambda x: json.loads(x.decode('utf-8'))
        )
        
        logger.info(f"Listening on topic: {KAFKA_TOPIC}")

        for message in consumer:
            data = message.value
            attempt_id = data.get('attemptId')
            model_id = data.get('testId')
            answers = data.get('answers', {})
            
            if not attempt_id:
                logger.warning("Message missing attemptId. Skipping.")
                continue

            logger.info(f"Processing Submission - Attempt: {attempt_id}")
            
            # 1. Analyze
            insights = analyze_performance(answers, model_id)
            
            if insights:
                # 2. Persist
                update_attempt_insights(attempt_id, insights)
            
    except Exception as e:
        logger.error(f"Consumer Error: {e}")

if __name__ == "__main__":
    main()
