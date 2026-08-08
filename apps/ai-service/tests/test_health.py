from app.main import app


def test_app_title():
    assert app.title.startswith("Smart Dental")
