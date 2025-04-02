from datetime import datetime
from app import db

class SearchHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    query = db.Column(db.Text, nullable=False)
    response = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<SearchHistory {self.query[:20]}...>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'query': self.query,
            'response': self.response,
            'timestamp': self.timestamp.strftime('%Y-%m-%d %H:%M:%S')
        }