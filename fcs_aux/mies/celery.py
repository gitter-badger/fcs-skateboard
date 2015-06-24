from __future__ import absolute_import
from celery import Celery

# TODO separate queues

app = Celery('mies',
             include=[
                 'mies.data_pipes.twitter_social_feed.pipe',
                 'mies.lifecycle_managers.daily_building.manager',
                 'mies.lifecycle_managers.residents_life.manager',
                 'mies.buildings.model',
                 'mies.senses.smell.smell_propagator',
                 'fconveys.actions.fetch_content.fetch_article',
             ])

app.config_from_object('mies.celery_config')
