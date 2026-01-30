"""
SEO Pre-rendering Tests for World Auto France
Tests the /seo/annonce/{id} endpoint and validates SEO meta tags
"""
import pytest
import requests
import os
import re

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
BACKEND_DIRECT_URL = "http://localhost:8001"  # Direct backend access for SEO endpoint

class TestSEOEndpoint:
    """Tests for the SEO pre-rendering endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get a valid listing ID for testing"""
        response = requests.get(f"{BASE_URL}/api/listings?limit=1")
        assert response.status_code == 200, f"Failed to get listings: {response.text}"
        data = response.json()
        assert data.get('listings'), "No listings found in database"
        self.listing_id = data['listings'][0]['id']
        self.listing_title = data['listings'][0]['title']
        self.listing_price = data['listings'][0]['price']
    
    def test_seo_endpoint_returns_200(self):
        """Test that /seo/annonce/{id} returns 200 for valid listing"""
        response = requests.get(f"{BACKEND_DIRECT_URL}/seo/annonce/{self.listing_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_seo_endpoint_returns_html(self):
        """Test that /seo/annonce/{id} returns HTML content"""
        response = requests.get(f"{BACKEND_DIRECT_URL}/seo/annonce/{self.listing_id}")
        assert response.status_code == 200
        content_type = response.headers.get('content-type', '')
        assert 'text/html' in content_type, f"Expected text/html, got {content_type}"
    
    def test_seo_endpoint_contains_title_tag(self):
        """Test that SEO page contains proper title tag with listing info"""
        response = requests.get(f"{BACKEND_DIRECT_URL}/seo/annonce/{self.listing_id}")
        assert response.status_code == 200
        html = response.text
        
        # Check for title tag
        title_match = re.search(r'<title>([^<]+)</title>', html)
        assert title_match, "No title tag found in SEO page"
        title = title_match.group(1)
        
        # Title should contain listing title and price
        assert self.listing_title in title or str(self.listing_price) in title, \
            f"Title '{title}' doesn't contain listing info"
        assert "World Auto France" in title, f"Title '{title}' doesn't contain site name"
    
    def test_seo_endpoint_contains_meta_description(self):
        """Test that SEO page contains meta description"""
        response = requests.get(f"{BACKEND_DIRECT_URL}/seo/annonce/{self.listing_id}")
        assert response.status_code == 200
        html = response.text
        
        # Check for meta description
        desc_match = re.search(r'<meta name="description" content="([^"]*)"', html)
        assert desc_match, "No meta description found in SEO page"
        description = desc_match.group(1)
        assert len(description) > 0, "Meta description is empty"
    
    def test_seo_endpoint_contains_og_tags(self):
        """Test that SEO page contains Open Graph tags"""
        response = requests.get(f"{BACKEND_DIRECT_URL}/seo/annonce/{self.listing_id}")
        assert response.status_code == 200
        html = response.text
        
        # Check for required OG tags
        og_tags = ['og:type', 'og:url', 'og:title', 'og:description', 'og:image']
        for tag in og_tags:
            pattern = f'<meta property="{tag}" content="([^"]*)"'
            match = re.search(pattern, html)
            assert match, f"Missing Open Graph tag: {tag}"
            assert len(match.group(1)) > 0, f"Empty Open Graph tag: {tag}"
    
    def test_seo_endpoint_contains_canonical_url(self):
        """Test that SEO page contains canonical URL"""
        response = requests.get(f"{BACKEND_DIRECT_URL}/seo/annonce/{self.listing_id}")
        assert response.status_code == 200
        html = response.text
        
        # Check for canonical link
        canonical_match = re.search(r'<link rel="canonical" href="([^"]+)"', html)
        assert canonical_match, "No canonical URL found in SEO page"
        canonical = canonical_match.group(1)
        assert self.listing_id in canonical, f"Canonical URL '{canonical}' doesn't contain listing ID"
        assert "worldautofrance.com" in canonical, f"Canonical URL '{canonical}' doesn't point to production domain"
    
    def test_seo_endpoint_contains_schema_org(self):
        """Test that SEO page contains Schema.org JSON-LD"""
        response = requests.get(f"{BACKEND_DIRECT_URL}/seo/annonce/{self.listing_id}")
        assert response.status_code == 200
        html = response.text
        
        # Check for JSON-LD script
        jsonld_match = re.search(r'<script type="application/ld\+json">\s*(\{[^<]+\})\s*</script>', html, re.DOTALL)
        assert jsonld_match, "No Schema.org JSON-LD found in SEO page"
        
        # Validate it's valid JSON
        import json
        try:
            schema = json.loads(jsonld_match.group(1))
            assert schema.get('@context') == 'https://schema.org', "Invalid Schema.org context"
            assert schema.get('@type') == 'Product', "Schema type should be Product"
            assert 'offers' in schema, "Schema should contain offers"
        except json.JSONDecodeError as e:
            pytest.fail(f"Invalid JSON-LD: {e}")
    
    def test_seo_endpoint_returns_404_for_invalid_listing(self):
        """Test that /seo/annonce/{id} returns 404 for non-existent listing"""
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = requests.get(f"{BACKEND_DIRECT_URL}/seo/annonce/{fake_id}")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
    
    def test_seo_endpoint_contains_robots_meta(self):
        """Test that SEO page has robots meta tag allowing indexing"""
        response = requests.get(f"{BACKEND_DIRECT_URL}/seo/annonce/{self.listing_id}")
        assert response.status_code == 200
        html = response.text
        
        # Check for robots meta tag
        robots_match = re.search(r'<meta name="robots" content="([^"]+)"', html)
        assert robots_match, "No robots meta tag found"
        robots = robots_match.group(1)
        assert 'index' in robots.lower(), f"Robots tag '{robots}' should allow indexing"
        assert 'noindex' not in robots.lower(), f"Robots tag '{robots}' should not have noindex"


class TestNginxConfiguration:
    """Tests to validate nginx configuration for SEO pre-rendering"""
    
    def test_nginx_config_exists(self):
        """Test that nginx.conf exists"""
        nginx_path = "/app/frontend/nginx.conf"
        assert os.path.exists(nginx_path), f"nginx.conf not found at {nginx_path}"
    
    def test_nginx_config_has_seo_prerender_location(self):
        """Test that nginx.conf has @seo_prerender location"""
        with open("/app/frontend/nginx.conf", "r") as f:
            config = f.read()
        
        assert "@seo_prerender" in config, "nginx.conf missing @seo_prerender location"
        assert "location @seo_prerender" in config, "nginx.conf missing @seo_prerender location block"
    
    def test_nginx_config_has_crawler_detection(self):
        """Test that nginx.conf detects Google crawlers"""
        with open("/app/frontend/nginx.conf", "r") as f:
            config = f.read()
        
        # Check for User-Agent detection
        assert "$http_user_agent" in config, "nginx.conf missing User-Agent detection"
        
        # Check for Google crawler patterns
        google_patterns = ["Google", "Googlebot", "AdsBot", "APIs-Google", "Mediapartners"]
        for pattern in google_patterns:
            assert pattern in config, f"nginx.conf missing crawler pattern: {pattern}"
    
    def test_nginx_config_has_annonce_location(self):
        """Test that nginx.conf has /annonce/ location with SEO routing"""
        with open("/app/frontend/nginx.conf", "r") as f:
            config = f.read()
        
        # Check for annonce location
        assert 'location ~ ^/annonce/' in config, "nginx.conf missing /annonce/ location"
        
        # Check for error_page 418 trick
        assert "error_page 418" in config, "nginx.conf missing error_page 418 for SEO routing"
        assert "return 418" in config, "nginx.conf missing return 418 for crawler detection"
    
    def test_nginx_config_proxies_to_backend(self):
        """Test that nginx.conf proxies SEO requests to backend"""
        with open("/app/frontend/nginx.conf", "r") as f:
            config = f.read()
        
        # Check for proxy_pass to backend SEO endpoint
        assert "proxy_pass http://backend:8001/seo/annonce" in config, \
            "nginx.conf should proxy to backend:8001/seo/annonce"


class TestGoogleSearchConsoleIssues:
    """Tests to identify potential Google Search Console issues"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get a valid listing ID for testing"""
        response = requests.get(f"{BASE_URL}/api/listings?limit=1")
        if response.status_code == 200:
            data = response.json()
            if data.get('listings'):
                self.listing_id = data['listings'][0]['id']
    
    def test_seo_page_not_soft_404(self):
        """Test that SEO page doesn't look like a soft 404"""
        response = requests.get(f"{BACKEND_DIRECT_URL}/seo/annonce/{self.listing_id}")
        assert response.status_code == 200
        html = response.text.lower()
        
        # Check for soft 404 indicators
        soft_404_indicators = [
            "page not found",
            "404",
            "not found",
            "page introuvable",
            "cette page n'existe pas",
            "erreur",
            "error"
        ]
        
        # These should NOT be in the main content (but can be in footer links)
        main_content = html.split('<footer')[0] if '<footer' in html else html
        
        for indicator in soft_404_indicators:
            # Allow "404" in links but not as main content
            if indicator == "404":
                continue
            assert indicator not in main_content.split('<nav')[0] if '<nav' in main_content else True, \
                f"SEO page contains soft 404 indicator: {indicator}"
    
    def test_seo_page_has_substantial_content(self):
        """Test that SEO page has substantial content (not thin content)"""
        response = requests.get(f"{BACKEND_DIRECT_URL}/seo/annonce/{self.listing_id}")
        assert response.status_code == 200
        html = response.text
        
        # Remove HTML tags to get text content
        text = re.sub(r'<[^>]+>', ' ', html)
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Page should have at least 200 characters of content
        assert len(text) > 200, f"SEO page has thin content ({len(text)} chars)"
    
    def test_seo_page_has_unique_content(self):
        """Test that SEO page has unique content per listing"""
        # Get two different listings
        response = requests.get(f"{BASE_URL}/api/listings?limit=2")
        if response.status_code != 200:
            pytest.skip("Could not get listings")
        
        data = response.json()
        if len(data.get('listings', [])) < 2:
            pytest.skip("Not enough listings to compare")
        
        listing1_id = data['listings'][0]['id']
        listing2_id = data['listings'][1]['id']
        
        # Get SEO pages for both
        response1 = requests.get(f"{BACKEND_DIRECT_URL}/seo/annonce/{listing1_id}")
        response2 = requests.get(f"{BACKEND_DIRECT_URL}/seo/annonce/{listing2_id}")
        
        if response1.status_code != 200 or response2.status_code != 200:
            pytest.skip("Could not get SEO pages")
        
        # Pages should be different
        assert response1.text != response2.text, "SEO pages should have unique content per listing"
    
    def test_seo_page_loads_fast(self):
        """Test that SEO page loads quickly (important for crawlers)"""
        import time
        
        start = time.time()
        response = requests.get(f"{BACKEND_DIRECT_URL}/seo/annonce/{self.listing_id}")
        elapsed = time.time() - start
        
        assert response.status_code == 200
        assert elapsed < 2.0, f"SEO page took {elapsed:.2f}s to load (should be < 2s)"


class TestCrawlerUserAgents:
    """Test various Google crawler User-Agents"""
    
    GOOGLE_USER_AGENTS = [
        ("Googlebot Desktop", "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"),
        ("Googlebot Mobile", "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"),
        ("Googlebot Smartphone", "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"),
        ("AdsBot-Google", "AdsBot-Google (+http://www.google.com/adsbot.html)"),
        ("AdsBot-Google-Mobile", "Mozilla/5.0 (Linux; Android 5.0; SM-G920A) AppleWebKit (KHTML, like Gecko) Chrome Mobile Safari (compatible; AdsBot-Google-Mobile; +http://www.google.com/mobile/adsbot.html)"),
        ("APIs-Google", "APIs-Google (+https://developers.google.com/webmasters/APIs-Google.html)"),
        ("Mediapartners-Google", "Mediapartners-Google"),
        ("Google-InspectionTool", "Mozilla/5.0 (compatible; Google-InspectionTool/1.0;)"),
        ("Googlebot-Image", "Googlebot-Image/1.0"),
        ("Googlebot-News", "Googlebot-News"),
        ("Googlebot-Video", "Googlebot-Video/1.0"),
    ]
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get a valid listing ID for testing"""
        response = requests.get(f"{BASE_URL}/api/listings?limit=1")
        if response.status_code == 200:
            data = response.json()
            if data.get('listings'):
                self.listing_id = data['listings'][0]['id']
    
    @pytest.mark.parametrize("name,user_agent", GOOGLE_USER_AGENTS)
    def test_crawler_user_agent_detected(self, name, user_agent):
        """Test that nginx config would detect this User-Agent"""
        with open("/app/frontend/nginx.conf", "r") as f:
            config = f.read()
        
        # Extract the User-Agent pattern from nginx config
        ua_pattern_match = re.search(r'\$http_user_agent ~\* "([^"]+)"', config)
        if not ua_pattern_match:
            pytest.skip("Could not find User-Agent pattern in nginx config")
        
        nginx_pattern = ua_pattern_match.group(1)
        
        # Check if any part of the nginx pattern matches the User-Agent
        patterns = nginx_pattern.split('|')
        matched = any(p.lower() in user_agent.lower() for p in patterns)
        
        assert matched, f"User-Agent '{name}' not detected by nginx pattern: {nginx_pattern}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
