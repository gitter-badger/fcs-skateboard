from celery.utils.log import get_task_logger
import os
import requests
from tempfile import NamedTemporaryFile
import textract
from mies.celery import app

logging = get_task_logger(__name__)


def download_file(url, chunk_size=1024):
    f = NamedTemporaryFile(delete=False)
    local_filename = f.name
    r = requests.get(url, stream=True)
    with open(local_filename, 'wb') as f:
        for chunk in r.iter_content(chunk_size=chunk_size):
            # filter out keep-alive new chunks
            if chunk:
                f.write(chunk)
                f.flush()
    return local_filename

def delete_downloaded_file(file_name):
     os.unlink(file_name)

@app.task(name='fetch-article')
def fetch_article_action(input_payload):
    logging.info("Fetching article from social post")
    logging.info(input_payload)

    result_payloads = []
    for link in input_payload["urls"]:
        url = link.expanded_url
        display_url = link.display_url
        shortened_url = link.url

        # TODO perform a GET request to fetch the link file
        file_name = download_file(url)
        logging.info("Downloaded article into temp file: {}".format(file_name))

        # TODO parse the file with textract
        text = textract.process(file_name)
        logging.info("Extracted article text ({} characters)".format(len(text)))
        logging.info("T"*100)
        logging.info(text)
        logging.info("T"*100)

        # TODO delete the file
        delete_downloaded_file(file_name)
        logging.info("Deleted temp file: {}".format(file_name))

        # TODO append the parsed article text
        result_payloads.append(
            {
                "content_type": "article-text",
                "key": url,
                "payload": {
                    "url": url,
                    "display_url": display_url,
                    "shortened_url": shortened_url,
                    "text": text
                },
                "placement_hints": {
                    "new_bldg": True,
                    "same_flr": False,
                    "flr_above": True,
                    "location_by_index": False,
                    "same_location": True,
                }
            }
        )

    return result_payloads

