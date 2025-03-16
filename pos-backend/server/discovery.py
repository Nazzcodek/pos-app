import threading
import socket
from zeroconf import ServiceInfo, Zeroconf


class ZeroconfPublisher:
    def __init__(self, service_name: str, port: int, service_type: str = "_websocket._tcp.local."):
        self.zeroconf = None
        self.service_info = None
        self.service_name = service_name
        self.port = port
        self.service_type = service_type
        self.thread = None
        self.running = False

    def start(self):
        """Start publishing the service on a separate thread"""
        if self.running:
            return
        
        self.thread = threading.Thread(target=self._run_zeroconf)
        self.thread.daemon = True
        self.thread.start()
        self.running = True

    def _run_zeroconf(self):
        """Run the Zeroconf service"""
        self.zeroconf = Zeroconf()
        
        # Get local IP address
        hostname = socket.gethostname()
        local_ip = socket.gethostbyname(hostname)
        
        # Create service info
        self.service_info = ServiceInfo(
            self.service_type,
            f"{self.service_name}.{self.service_type}",
            addresses=[socket.inet_aton(local_ip)],
            port=self.port,
            properties={
                'version': '1.0',
                'description': 'FastAPI WebSocket Service'
            }
        )
        
        # Register the service
        self.zeroconf.register_service(self.service_info)
        print(f"Zeroconf service registered: {self.service_name} at {local_ip}:{self.port}")

    def stop(self):
        """Stop the Zeroconf service"""
        if not self.running:
            return
            
        if self.zeroconf and self.service_info:
            self.zeroconf.unregister_service(self.service_info)
            self.zeroconf.close()
            self.running = False
            print("Zeroconf service unregistered")
