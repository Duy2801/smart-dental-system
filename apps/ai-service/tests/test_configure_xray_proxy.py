import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location(
    "configure_xray_proxy",
    Path(__file__).resolve().parents[1] / "scripts/configure_xray_proxy.py",
)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ConfigureXrayProxyTest(unittest.TestCase):
    def test_updates_only_backend_servers_and_is_idempotent(self):
        site = """server {
    server_name duybackend.waucaptcha.com;
    location / { proxy_pass http://localhost:3000; }
    listen 443 ssl;
}
server {
    server_name another.example.com;
    listen 80;
}
server {
    server_name duybackend.waucaptcha.com;
    listen 80;
}
"""
        updated = module.configure(site, "duybackend.waucaptcha.com", 260)
        self.assertEqual(updated.count("proxy_read_timeout 260s;"), 2)
        self.assertIn("server_name another.example.com;\n    listen 80;", updated)
        self.assertEqual(module.configure(updated, "duybackend.waucaptcha.com", 260), updated)
        changed = module.configure(updated, "duybackend.waucaptcha.com", 300)
        self.assertEqual(changed.count("proxy_read_timeout 300s;"), 2)
        self.assertNotIn("proxy_read_timeout 260s;", changed)

    def test_keeps_unrelated_sites_unchanged(self):
        site = "server {\n    server_name another.example.com;\n}\n"
        self.assertEqual(module.configure(site, "duybackend.waucaptcha.com", 260), site)

    def test_refuses_to_overwrite_manual_timeout(self):
        site = """server {
    server_name duybackend.waucaptcha.com;
    proxy_read_timeout 180s;
}
"""
        with self.assertRaises(ValueError):
            module.configure(site, "duybackend.waucaptcha.com", 260)


if __name__ == "__main__":
    unittest.main()
