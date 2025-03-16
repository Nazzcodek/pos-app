import pytz
from datetime import datetime


def current_time():
    utc_plus_one = pytz.timezone('Africa/Lagos')
    return datetime.now(utc_plus_one)

def to_utc(dt):
    """Convert a datetime to UTC for storage"""
    if dt.tzinfo is None:
        # Assume local time is UTC+1
        utc_plus_one = pytz.timezone('Africa/Lagos')
        dt = utc_plus_one.localize(dt)
    return dt.astimezone(pytz.UTC)

def from_utc(dt, tz_name='Africa/Lagos'):
    """Convert UTC datetime to specified timezone"""
    target_tz = pytz.timezone(tz_name)
    return dt.replace(tzinfo=pytz.UTC).astimezone(target_tz)