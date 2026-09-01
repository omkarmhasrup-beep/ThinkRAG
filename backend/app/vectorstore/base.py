from abc import ABC, abstractmethod
from typing import List, Dict

class BaseVectorStore(ABC):
    @abstractmethod
    def add_documents(self, user_id: int, documents: List):
        pass

    @abstractmethod
    def search(self, user_id: int, query: str, k: int = 4) -> List[Dict]:
        pass

    @abstractmethod
    def get_stats(self, user_id: int) -> Dict:
        pass
