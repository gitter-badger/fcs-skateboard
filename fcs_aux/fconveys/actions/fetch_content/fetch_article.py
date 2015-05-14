from celery.utils.log import get_task_logger
from mies.celery import app

logging = get_task_logger(__name__)


@app.task(name='fetch_article')
def fetch_article_action(input_payload):
    logging.info("Fetching article from social post")
    logging.info(input_payload)
    # TODO implement & remove dummy result
    return {
        "url": "http://example.org/articles/some.html",
        "text": "This is the artcile text"
    }
