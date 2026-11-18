"""Fixtures communes : intégrations personnalisées activées."""
import pytest


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    """Charge custom_components/child_alert dans chaque test."""
    yield
