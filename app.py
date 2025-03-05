from flask import Flask, request, jsonify
from flask_cors import CORS
from waitress import serve  # Import waitress
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv
import os

load_dotenv()

# Initialize Flask app
app = Flask(__name__)

CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Task model
class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    task = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(50), nullable=False)

    def __repr__(self):
        return f"<Task {self.task}>"

# Create all database tables (run once during initial setup)
with app.app_context():
    db.create_all()

# Route to add a new task
@app.route('/tasks', methods=['POST'])
def add_task():
    try:
        task_data = request.json
        task_name = task_data.get('task')
        task_status = task_data.get('status')

        if not task_name or not task_status:
            return jsonify({"message": "Task and status are required"}), 400

        new_task = Task(task=task_name, status=task_status)
        db.session.add(new_task)
        db.session.commit()

        return jsonify({"message": "Task added", "task": {"id": new_task.id, "task": task_name, "status": task_status}}), 201

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"message": f"Error adding task: {str(e)}"}), 500

# Route to get all tasks
@app.route('/tasks', methods=['GET'])
def get_tasks():
    try:
        tasks = Task.query.all()  # Fetch all tasks from the database
        task_list = [{"id": task.id, "task": task.task, "status": task.status} for task in tasks]
        return jsonify({"tasks": task_list}), 200  # Send tasks as JSON response
    except SQLAlchemyError as e:
        return jsonify({"message": f"Error fetching tasks: {str(e)}"}), 500


# Route to update a task's status
@app.route('/tasks/<int:id>', methods=['PUT'])
def update_task(id):
    try:
        task = Task.query.get_or_404(id)
        task_data = request.json
        new_status = task_data.get('status')

        if not new_status:
            return jsonify({"message": "Status is required"}), 400

        task.status = new_status
        db.session.commit()
        return jsonify({"message": "Task updated", "task": {"id": task.id, "task": task.task, "status": task.status}}), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"message": f"Error updating task: {str(e)}"}), 500

# Route to delete a task
@app.route('/tasks/<int:id>', methods=['DELETE'])
def delete_task(id):
    try:
        task = Task.query.get_or_404(id)
        db.session.delete(task)
        db.session.commit()
        return jsonify({"message": "Task deleted"}), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"message": f"Error deleting task: {str(e)}"}), 500

# Use waitress to serve the app in production
if __name__ == "__main__":
    serve(app, host='0.0.0.0', port=5000)  # Use waitress to run the app
