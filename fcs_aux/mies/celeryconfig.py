from datetime import timedelta
# from celery.schedules import crontab

BROKER_URL = 'amqp://guest:guest@localhost:5672//'

CELERY_TASK_RESULT_EXPIRES = 3600
CELERY_TASK_SERIALIZER = 'json'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_RESULT_SERIALIZER = 'json'
CELERY_CREATE_MISSING_QUEUES = True

CELERY_ENABLE_UTC = True
CELERY_TIMEZONE = 'UTC'

DATA_PIPES_INTERVAL = 10

CELERYBEAT_SCHEDULE = {
    'invoke_data_pipes_every_few_minutes': {
        'task': 'mies.data_pipes.twitter_social_feed.pipe.invoke',
        'schedule': timedelta(minutes=DATA_PIPES_INTERVAL),

    },
    'invoke_daily_lifecycle_manager_every_day': {
        'task': 'mies.lifecycle_managers.daily_building.manager.invoke',
        # 'schedule': crontab(minute=0, hour=0),
        'schedule': timedelta(hours=1),
    }
}
