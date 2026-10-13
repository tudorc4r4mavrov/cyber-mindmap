/* ============================================================
   Cybersecurity Knowledge Journey — data model
   Networking category. Content distilled from the learner guide
   "Networking for Junior Cybersecurity" (v1.1).
   Pattern per concept: definition -> concrete Northstar example
   -> security meaning, with a matched code/config/analyst snippet.
   ============================================================ */

const CATEGORIES = [
  { id: "networking",   name: "Networking",               tagline: "How packets travel, and where security lives", status: "ready", hue: "cyan"  },
  { id: "pentesting",   name: "Pentesting Methodologies", tagline: "Structured approaches to authorized offense",  status: "ready",  hue: "green" },
  { id: "programming",  name: "Programming Languages",    tagline: "Languages & frameworks for security work",     status: "soon",  hue: "amber" },
];

/* 8 clusters, ordered clockwise from the top; accents chosen so neighbours contrast. */
const CLUSTERS = [
  { id: "journey",   label: "The Packet Journey",        accent: "cyan",   blurb: "Networking is a chain of decisions. Each stage makes the next possible without guaranteeing it." },
  { id: "local",     label: "Local Delivery",            accent: "violet", blurb: "Reaching the next hop on this link: switching, VLANs, and the address resolution underneath." },
  { id: "address",   label: "Addressing",                accent: "green",  blurb: "Prefixes decide what is local and what must be routed. IPv4, subnetting, and IPv6." },
  { id: "routing",   label: "Routing & NAT",             accent: "amber",  blurb: "Choosing a direction toward a destination, rewriting addresses, and the architecture behind it." },
  { id: "transport", label: "Transport & Core Services", accent: "rose",   blurb: "Ports, streams, control messages, and turning names into addresses." },
  { id: "webapp",    label: "Web, Mail & Remote Access", accent: "teal",   blurb: "HTTP, TLS, proxies, remote administration and email — and what each one actually proves." },
  { id: "access",    label: "Identity & Access Control", accent: "indigo", blurb: "Who is connecting and what they may do: enterprise identity, firewalls, wireless, and VPNs." },
  { id: "evidence",  label: "Evidence & Modern Env.",    accent: "coral",  blurb: "Detection, attacks, packet analysis, trustworthy time and logs, and cloud networking." },
];

function C(o){ return o; }

const CONCEPTS = [

  /* ========================= 1 · THE PACKET JOURNEY ========================= */
  C({
    id: "web-request", cluster: "journey", title: "How a Web Request Travels",
    short: "The end-to-end chain of decisions behind one page load.",
    body: [
      { h: "The idea", p: "Your computer cannot deliver a request just because it knows a website name. It needs configuration, an address for the destination, a route toward it, a local delivery mechanism, and a conversation with the service. The receiver must also be able and permitted to reply." },
      { h: "One conversation, stage by stage", list: [
        "Configuration is already in place (usually via DHCP) — a prerequisite, not re-run per site.",
        "Before the DNS query, the host picks a route to the resolver; if it is off-subnet, the path uses the gateway (ARP resolves the gateway's MAC).",
        "The resolver answers from cache or does the lookup; the reply returns to the client.",
        "With the server's address known, the host routes to it — Ethernet destination is the gateway's MAC, the IP destination is the server.",
        "TCP is established to port 443; the client's source port is ephemeral.",
        "TLS negotiates protection and authenticates the server, then HTTP flows inside the protected connection.",
        "Replies traverse a return path; a NAT device may reverse its translation.",
      ]},
      { h: "Why it matters", p: "Each successful stage enables the next without proving it. A DNS answer proves what that observer saw, not that a user chose to visit. A TCP handshake proves a connection was established, not that login succeeded. An encrypted connection proves neither benign intent nor successful theft — you need application or endpoint evidence for those." },
      { h: "What an analyst can state", p: "\"Workstation 10.20.10.25 established TCP to 203.0.113.80:443 at 09:14 UTC. The preceding DNS answer associated that address with portal.example.test. The capture does not reveal the encrypted HTTP content.\"" },
    ],
    code: { lang: "text", label: "The first frame toward the server", text:
`Eth source   Workstation MAC   this interface
Eth dest     Gateway MAC       next on link
IPv4 source  10.20.10.25       before edge NAT
IPv4 dest    203.0.113.80      remote target
TCP sport    51532             client (ephemeral)
TCP dport    443               server endpoint

# MAC addresses change at every routed hop.
# IP src/dst preserved by normal forwarding
#   (NAT can change them). TTL decrements.` },
    links: ["layers","dns","arp","routing","nat","tcp","http-tls"],
  }),

  C({
    id: "layers", cluster: "journey", title: "Layers & Encapsulation",
    short: "A model for locating the failing step.",
    body: [
      { h: "Encapsulation", p: "Placing data inside the message of a lower layer. For HTTPS over TCP and Ethernet: HTTP is protected by TLS, carried in TCP, carried by IP, placed in Ethernet frames. The receiver works inward through each structure to reach the application meaning." },
      { h: "The four questions", list: [
        "Application (OSI 5–7): DNS, HTTP, TLS, SSH — did the service exchange the expected messages?",
        "Transport (4): TCP, UDP — can the application endpoints communicate?",
        "Internet (3): IPv4, IPv6, ICMP — is there a route and valid addressing?",
        "Link (1–2): Ethernet, Wi-Fi — can the next hop be reached on this link?",
      ]},
      { h: "Precise names help", p: "An Ethernet frame, an IP packet, a TCP segment, a UDP datagram. One application message may span many segments; one segment may carry parts of several messages. This is why following a stream is often more useful than reading one packet." },
      { h: "Reliability ≠ integrity ≠ identity", p: "Ethernet's frame check detects transmission errors. TCP's checksum is error detection, not protection against deliberate modification. TLS supplies cryptographic integrity and confidentiality — and application validation decides whether the content is acceptable. A successful lower layer never guarantees success above it." },
    ],
    code: { lang: "text", label: "Protocol nesting (HTTPS over TCP)", text:
`Ethernet frame   | local src/dst MAC
  IP packet      | src/dst IP
    TCP segment  | ports + stream control
      TLS records| protection of app data
        HTTP     | request / response

# "Packet" is used generically in tools.
# Reassembly is why a *stream* beats a packet.` },
    links: ["web-request","tcp","http-tls","mac-switching"],
  }),

  /* ========================= 2 · LOCAL DELIVERY ========================= */
  C({
    id: "mac-switching", cluster: "local", title: "Ethernet, MAC & Switching",
    short: "IP and MAC solve different problems; a switch learns by watching.",
    body: [
      { h: "Two address jobs", p: "An IP address identifies an endpoint in an IP network; routers use it to choose a path. A MAC address delivers a frame across the current Ethernet link. Workstation 10.20.10.25 wants server 203.0.113.80 to receive the packet, but the first device to receive its frame is gateway 10.20.10.1 — so the packet carries the remote IP while the frame carries the gateway's MAC. They describe different parts of the delivery job." },
      { h: "How a switch learns", p: "It builds a forwarding table by watching the source MAC of arriving frames. To forward, it looks up the destination MAC. Learning uses the source; forwarding uses the destination. If the destination is unknown, an ordinary switch floods the unknown unicast within that VLAN — copies out eligible ports, not a broadcast across the whole organization. Entries age out over time." },
      { h: "A capture surprise", p: "Promiscuous mode makes an interface accept frames not addressed to it — it does not tell the switch to copy everyone else's traffic to your port. To observe another conversation you need a mirror port, a tap, or an endpoint capture." },
      { h: "Security meaning", p: "A MAC is useful for forwarding and correlation, but a device can randomize it, so it is not strong proof of identity. MAC-table exhaustion attacks try to force flooding by overflowing the table." },
    ],
    code: { lang: "bash", label: "Analyst: forwarding / neighbor tables", text:
`# Workstation — current IP<->MAC neighbors
ip neigh            # Linux
arp -a              # Windows / macOS

# Switch — where MACs are learned
show mac address-table
show mac address-table vlan 10

# Wireshark: isolate L2 broadcast + ARP noise
eth.dst == ff:ff:ff:ff:ff:ff or arp` },
    links: ["arp","vlan","layers","web-request"],
  }),

  C({
    id: "vlan", cluster: "local", title: "VLANs & Segmentation",
    short: "One switching fabric behaving as several separate local networks.",
    body: [
      { h: "What a VLAN is", p: "A logical Layer 2 broadcast domain. In the example network, VLAN 10 holds employees, VLAN 20 servers, VLAN 30 guests. A broadcast in VLAN 10 stays in VLAN 10. A frame cannot simply be switched from an employee port into a server port — crossing VLANs needs a Layer 3 path (router, routing switch, or firewall). That is inter-VLAN routing." },
      { h: "VLAN vs subnet", p: "Related design choices, different objects. The VLAN is Layer 2 membership; the subnet is an IP prefix. Many designs place one subnet per VLAN, but the VLAN number is not an IP address or a routing rule." },
      { h: "Access ports and trunks", p: "An access port normally gives one data VLAN to an endpoint. A trunk carries multiple VLANs across a link, often between switches. IEEE 802.1Q tags identify VLAN membership on tagged frames. Do not assume every trunk tags every frame — native-VLAN handling is platform-dependent." },
      { h: "Where separation becomes security", p: "The sequence matters: VLANs separate switching; routing connects IP networks; traffic policy decides which conversations may cross. A diagram with different VLAN colors does not prove the rules enforce isolation. Same-VLAN traffic may never pass the central firewall. VLAN hopping exploits specific trunk/native-VLAN misconfigurations — it is not inherent to VLANs." },
    ],
    code: { lang: "text", label: "Config: an access port and a trunk (Cisco IOS)", text:
`! Employee access port — one data VLAN
interface GigabitEthernet0/5
 switchport mode access
 switchport access vlan 10
 spanning-tree bpduguard enable

! Uplink trunk — carries selected VLANs only
interface GigabitEthernet0/1
 switchport mode trunk
 switchport trunk allowed vlan 10,20,30
 switchport trunk native vlan 999   ! unused

# Least privilege at L2: explicit access ports,
# restricted trunks, deliberate native VLAN.` },
    links: ["mac-switching","firewalls","routing"],
  }),

  C({
    id: "arp", cluster: "local", title: "ARP — Local Address Resolution",
    short: "Fills in the local delivery MAC for the chosen next hop.",
    body: [
      { h: "What ARP does", p: "Knowing an IPv4 destination is not enough to build a frame. The host first selects a route, which identifies the local next recipient — the destination itself if on-link, otherwise a router. ARP then discovers the MAC for that recipient's IPv4 address. The request is local: it resolves the next hop on this link, not the remote server's MAC." },
      { h: "The cache", p: "An ARP cache is a temporary address-to-MAC table, not a map of every reachable system. The remote server's absence from it is expected. Repeated unresolved requests can indicate a missing device, wrong VLAN, or incorrect prefix." },
      { h: "Why false ARP matters", p: "ARP does not strongly authenticate ownership. A malicious local host can claim that 10.20.10.1 belongs to its MAC, so gateway-bound frames go to the attacker — the basis of ARP poisoning. This can enable disruption or observation of unprotected traffic, but it does not by itself decrypt correctly validated TLS." },
      { h: "Investigate before accusing", p: "A changed binding can be legitimate (gateway failover, virtualization). Compare timing, switch ports, asset records, and other clients. Dynamic ARP Inspection validates bindings using trusted data, often built by DHCP snooping." },
    ],
    code: { lang: "bash", label: "Analyst: inspect & watch ARP bindings", text:
`# Current bindings; flag duplicate MACs
ip neigh show                 # Linux
arp -a                        # Windows / macOS

# Wireshark: spot gratuitous / conflicting ARP
arp.opcode == 2 and arp.src.proto_ipv4 == 10.20.10.1

# A second MAC claiming the gateway IP, tied to
# one switch port, is the lead — not proof.
# Check DAI config and asset records.` },
    links: ["mac-switching","dhcp","web-request","attacks"],
  }),

  C({
    id: "dhcp", cluster: "local", title: "DHCP — Starting Configuration",
    short: "Hands a client its address, mask, gateway, and resolver.",
    body: [
      { h: "DORA", p: "DHCPv4 commonly gives a client an address lease, mask, gateway, and DNS settings via Discover, Offer, Request, Acknowledge. Clients use UDP 68, servers UDP 67. This configures the interface once — it is not repeated each time you open a website." },
      { h: "Relays", p: "A DHCP server need not sit in every VLAN. A relay receives client messages and forwards the request toward a server on another network, then helps deliver the response back. The router is not simply flooding the original broadcast across the organization." },
      { h: "Leases become evidence", p: "A log that names 10.20.10.25 at 09:14 needs the lease covering 09:14 — the address may belong to a different device later. The lease links the address to a client identifier for an interval; endpoint inventory then links that identifier to a managed device. Neither a lease nor a MAC alone identifies the human using it." },
      { h: "Rogue DHCP", p: "A rogue server can offer an attacker-controlled gateway or resolver, so a client gets a usable address and is still redirected. Look for unexpected server identifiers, competing offers, and switch-port evidence. DHCP snooping restricts which ports may send server messages. An address like 169.254.x.x suggests DHCP was unavailable (APIPA / link-local)." },
    ],
    code: { lang: "bash", label: "Analyst: lease details & DORA capture", text:
`# What did this client lease, and from whom?
#  Linux:   /var/lib/dhcp/dhclient.leases
#  Windows: ipconfig /all   (look for DHCP Server)

# Wireshark: watch the whole DORA exchange
bootp            # (DHCPv4 shows as bootp)

# Two different servers answering = possible
# rogue DHCP. Correlate server IP to switch port.` },
    links: ["arp","dns","web-request","attacks"],
  }),

  /* ========================= 3 · ADDRESSING ========================= */
  C({
    id: "ipv4-subnet", cluster: "address", title: "IPv4 & Subnetting",
    short: "A prefix decides what is local and what must be routed.",
    body: [
      { h: "What a prefix tells you", p: "An IPv4 address is 32 bits, written as four decimal numbers 0–255. In 10.20.10.25/24, the slash says the first 24 bits are the network prefix; the rest distinguish addresses inside it. The slash is a count of network bits, not a count of devices — a larger prefix leaves fewer host bits and a smaller block. A /26 is smaller than a /24." },
      { h: "Why the boundary changes delivery", p: "A directly connected subnet tells the host which destinations are local. With 10.20.10.25/24, 10.20.10.80 is local (resolve its MAC, deliver directly), but 10.20.20.30 is remote (send via a router). An incorrect prefix creates misleading failures: believing a remote server is local means ARPing for a MAC that is not on the link; believing a local host is remote means routing unnecessarily." },
      { h: "One calculation, end to end", p: "For 10.20.10.77/26: 32 − 26 = 6 host bits, so 2^6 = 64 addresses per block. Blocks start at 0, 64, 128, 192, so 77 is in the 64–127 block. Network 10.20.10.64/26, broadcast .127, usable hosts .65–.126 (62). Bitwise: 77 is 01001101; the mask's last octet 192 is 11000000; masking leaves 01000000 = 64." },
      { h: "Ranges and overlap", list: [
        "Private: 10.0.0.0/8, 172.16.0.0/12 (only .16–.31), 192.168.0.0/16 — private does not mean trusted.",
        "127.0.0.0/8 loopback · 169.254.0.0/16 link-local · 224.0.0.0/4 multicast · 0.0.0.0/0 default route.",
        "VLSM: pick different prefix lengths for different needs; blocks must start on valid boundaries and not overlap.",
        "Two sites both using 192.168.1.0/24 make 192.168.1.20 ambiguous — a common VPN problem.",
      ]},
    ],
    code: { lang: "text", label: "Subnet math (/26) + capacity", text:
`77 = 01001101
mask .192 = 11000000
masked    = 01000000 = 64

Network   10.20.10.64/26
Broadcast 10.20.10.127
Hosts     .65 - .126   (62 usable)

/24=254  /25=126  /26=62  /27=30  /28=14
/30=2    /31=p2p  /32=host route` },
    links: ["routing","ipv6","arp"],
  }),

  C({
    id: "ipv6", cluster: "address", title: "IPv6 & Dual Stack",
    short: "128-bit addressing; two real paths when dual-stacked.",
    body: [
      { h: "A readable pattern", p: "IPv6 uses 128-bit addresses: eight groups of 16 bits in hexadecimal, colon-separated. Shorten by dropping leading zeros in a group and replacing one run of all-zero groups with :: (only once, or expansion is ambiguous). So 2001:0db8:0020:0010:0000:0000:0000:0025 becomes 2001:db8:20:10::25. With a /64 the first four groups are the subnet prefix. 2001:db8::/32 is reserved for documentation." },
      { h: "Several addresses on one interface is normal", list: [
        "::1 loopback · :: unspecified · fe80::/10 link-local (not routed globally).",
        "fc00::/7 unique-local (ULAs use fd00::/8) · ff00::/8 multicast · 2000::/3 global unicast.",
        "No IPv4-style broadcast — multicast handles local functions instead.",
        "A host can hold link-local, global, and temporary privacy addresses at once; an address need not permanently identify one machine.",
      ]},
      { h: "Neighbor Discovery & autoconfig", p: "ICMPv6 Neighbor Discovery replaces ARP: Neighbor Solicitation/Advertisement resolve link addresses; Router Solicitation/Advertisement discover routers; Duplicate Address Detection checks a new address. With SLAAC a host forms its own address from an advertised prefix. Stateful DHCPv6 assigns addresses; stateless DHCPv6 supplies other config; default-router information normally comes via Router Advertisements." },
      { h: "Dual-stack security", p: "A name can have A and AAAA records, so there are two real paths. An IPv4 deny rule is bypassed in effect if an overlooked IPv6 path permits the same access — review listeners, routes, and controls for both families. Rogue Router Advertisements can mislead hosts; RA Guard helps. Do not block all ICMPv6: it breaks Neighbor Discovery and path-MTU discovery." },
    ],
    code: { lang: "text", label: "Shortening & address ranges", text:
`2001:0db8:0020:0010:0000:0000:0000:0025
        -> 2001:db8:20:10::25   (/64 prefix)

::1        loopback
fe80::/10  link-local
fc00::/7   unique local (fd00::/8)
ff00::/8   multicast
2000::/3   global unicast
2001:db8::/32  documentation` },
    links: ["ipv4-subnet","routing","icmp"],
  }),

  /* ========================= 4 · ROUTING & NAT ========================= */
  C({
    id: "routing", cluster: "routing", title: "Routing Decisions",
    short: "Each router chooses the next direction; longest prefix wins.",
    body: [
      { h: "A router chooses the next direction", p: "A router uses the destination address to choose a forwarding action — a route pairs a destination prefix with a next hop or outgoing interface. Each router decides independently; the workstation does not choose every intermediate router. The next hop is the immediate recipient, not necessarily the final destination, so a correct first hop does not prove the whole path works." },
      { h: "Longest prefix match", p: "Among matching entries, the most specific (longest) prefix wins. For 10.50.4.12 with routes 10.50.4.0/24, 10.50.0.0/16, and 0.0.0.0/0, the /24 wins. 10.50.8.12 falls back to the /16; 203.0.113.80 uses the default. A default route is the chosen direction when nothing more specific matches — it does not promise delivery." },
      { h: "Selection vs installation", p: "Two stages are often confused. First the routing system decides which route to install for a prefix, using vendor preference (administrative distance) between sources and metrics within a routing process. Then forwarding picks the most-specific installed entry. Neither means a less-specific route defeats a more-specific one." },
      { h: "Route ≠ permit", p: "Routing answers where to send; policy answers whether the conversation may pass a control; the destination still needs a listener and authorization. You can have a valid route and a denied connection, or a permit rule with no working route." },
    ],
    code: { lang: "text", label: "Longest-prefix match", text:
`destination 10.50.4.12 matches:
  10.50.4.0/24   <- wins (most specific)
  10.50.0.0/16
  0.0.0.0/0      (default)

10.50.8.12   -> 10.50.0.0/16
203.0.113.80 -> 0.0.0.0/0

# admin distance = preference between sources
# metric = cost within one routing process` },
    links: ["nat","ipv4-subnet","firewalls","routing-arch"],
  }),

  C({
    id: "nat", cluster: "routing", title: "NAT & the Return Path",
    short: "Rewrites addressing at a boundary; attribution needs time.",
    body: [
      { h: "NAT rewrites addressing", p: "NAT changes IP addressing at a boundary. NAPT (often called PAT) also changes transport ports, so many internal connections share one public IPv4 address while staying distinguishable. Northstar's 10.20.10.25:51532 → 203.0.113.80:443 is seen outside as 198.51.100.10:62001 → 203.0.113.80:443; the device keeps enough state to reverse the return traffic." },
      { h: "Translation is not protection", p: "NAT does not encrypt the payload and does not replace a security policy. Static mappings, port forwarding, and destination NAT can deliberately make internal services reachable, so \"the server is behind NAT\" does not establish it is inaccessible. Review translation, filtering, and the actual listener together." },
      { h: "The reply is another forwarding problem", p: "The server's reply has its own destination and must find a valid path back; forward and return paths can differ. If a client's SYN reaches the server and a SYN-ACK leaves but the client never sees it, repeatedly opening the outbound rule ignores the evidence — inspect the return route, an intervening control, or capture visibility." },
      { h: "Attribution needs time, not just an address", p: "An external report naming only 198.51.100.10 can refer to many devices. Join the timestamp, protocol, public source port, destination, and NAT records to recover 10.20.10.25:51532, then the lease and endpoint records valid at that time. Even a correct match identifies a network endpoint, not a user or process." },
    ],
    code: { lang: "text", label: "One translated conversation", text:
`inside   10.20.10.25:51532 -> 203.0.113.80:443
outside  198.51.100.10:62001 -> 203.0.113.80:443
return   203.0.113.80:443 -> 198.51.100.10:62001
reversed 203.0.113.80:443 -> 10.20.10.25:51532

# a 2nd host 10.20.10.26:51532 maps to :62002
# attribution = time + proto + public port
#               + NAT record + lease` },
    links: ["routing","web-request","firewalls","ids"],
  }),

  C({
    id: "routing-arch", cluster: "routing", title: "Routing Architecture & Automation",
    short: "Dynamic routing, QoS, and the management plane — a map for later study.",
    body: [
      { h: "Concepts worth keeping", p: "OSPF is a link-state interior routing protocol: routers exchange information to compute paths within a routing domain. BGP exchanges reachability between autonomous systems using policy and path attributes — a chosen BGP route is not simply the fewest physical hops. A static route is configured deliberately; a dynamic protocol updates forwarding as topology or policy changes. Gateway redundancy lets a standby gateway take over on failure." },
      { h: "QoS and WAN", p: "Quality of Service classifies, queues, or limits traffic to manage performance. DSCP markings indicate requested treatment and can be rewritten or ignored; QoS grants neither confidentiality nor authorization, and priority cannot create unlimited bandwidth. WAN services such as MPLS describe transport, not application encryption; SD-WAN combines policy and overlay management across paths." },
      { h: "Management planes are security boundaries", p: "The data plane forwards traffic, the control plane determines forwarding, the management plane configures and observes. A controller or management API can have extensive power — restrict its exposure, authenticate access, audit changes, and protect secrets. Basic authentication encodes credentials with Base64 (reversible, no confidentiality); a bearer token works for whoever holds it." },
      { h: "A safe automation habit", p: "Ansible configures systems; Terraform and similar tools provision infrastructure. Infrastructure as code makes changes reviewable, but a reviewed file can still be wrong or drift from deployed state. Before an automated change: identify the exact resource and current state, preview the diff, check scope, and have a rollback; afterward verify effective config and a permitted and a denied path." },
    ],
    code: { lang: "text", label: "What to establish, as a junior analyst", text:
`For a routing incident, ask:
  which source installed the route?
  which prefix was selected?
  did a change precede the incident?

# A traceroute change alone does not prove a
# BGP hijack or route leak — that needs wider
# routing evidence.
# Base64 'auth' is encoding, not protection.` },
    links: ["routing","nat","ids"],
  }),

  /* ========================= 5 · TRANSPORT & CORE SERVICES ========================= */
  C({
    id: "tcp", cluster: "transport", title: "TCP, UDP, Ports & Sockets",
    short: "Ports select the application; TCP tracks a byte stream.",
    body: [
      { h: "An address is not enough to pick an application", p: "One server can offer web, SSH, and more on one IP by listening on different transport ports. A port is a number the transport protocol uses to distinguish endpoints; TCP 443 and UDP 443 are different. A socket is an application endpoint. The five-tuple — source IP, source port, destination IP, destination port, protocol — names a conversation; include time, because a tuple can be reused." },
      { h: "TCP prepares a conversation", p: "TCP provides an ordered byte stream with loss detection and recovery, keeping connection state at both ends. The three-way handshake (SYN, SYN-ACK, ACK) establishes starting sequence numbers — it does not log a user in or validate a certificate. Sequence numbers count bytes: an ACK of 1201 means the receiver expects byte 1201 next. An ACK confirms TCP receipt, not application success — a server can acknowledge bytes and then reject the request." },
      { h: "Flow vs congestion control", p: "Flow control concerns the receiver (a small or zero receive window means its buffers are full). Congestion control concerns the path (the sender limits unacknowledged data based on network conditions). A fast receiver does not make every link fast. FIN closes one direction; RST resets abruptly; PSH is a normal flag, not a sign of malice." },
      { h: "UDP leaves more to the application", p: "UDP sends independent datagrams with no handshake, ordering, or retransmission guarantees — the application may retry or build reliability on top. An unanswered UDP probe is ambiguous. QUIC runs over UDP while adding secure, reliable streams; HTTP/3 uses QUIC, so UDP 443 alone does not prove benign HTTPS." },
    ],
    code: { lang: "text", label: "Three-way handshake", text:
`1  C->S  SYN      seq=1000
2  S->C  SYN ACK  seq=9000 ack=1001
3  C->S  ACK      seq=1001 ack=9001

# SYN consumes one sequence position.
# Wireshark often shows *relative* seq (near 1).

five-tuple = srcIP srcPort dstIP dstPort proto
           + time (tuples get reused)` },
    links: ["http-tls","icmp","web-request","pcap"],
  }),

  C({
    id: "icmp", cluster: "transport", title: "ICMP, MTU & Troubleshooting",
    short: "Control messages, path discovery, and size limits.",
    body: [
      { h: "Control messages", p: "ICMP carries IP control and error messages and uses types and codes, not ports. Echo request/reply support ping; Time Exceeded supports traceroute when probes expire; Destination Unreachable reports certain failures. Ping success does not prove TCP 443 is allowed, and ping failure does not prove a host is down — a server can answer ping while its web app is stopped, or serve HTTPS while blocking Echo." },
      { h: "Traceroute's limited answer", p: "Traceroute sends probes with increasing TTL/Hop Limit; each expiring probe prompts a Time Exceeded reply that reveals a responding hop. Replies come from router control behavior, and some routers decline or rate-limit them, so a blank hop can coexist with successful delivery farther along. Different probe types can take different paths or hit different policy." },
      { h: "Size limits", p: "The MTU is the largest IP packet a link carries without fragmentation — typically 1500 bytes on Ethernet, less on tunnels. MSS describes TCP data size and is not the link MTU (1500 − 20 IP − 20 TCP = 1460, before options). The Don't Fragment flag can trigger an ICMP 'too big'; IPv6 routers do not fragment forwarded packets and rely on ICMPv6 Packet Too Big — so blocking all ICMPv6 breaks path-MTU discovery and Neighbor Discovery." },
      { h: "The MTU black hole", p: "If small requests work but larger transfers stall, suspect path-MTU: a tunnel with a smaller effective MTU passes small packets but drops a large one, and if the size feedback is filtered the transfer stalls while small exchanges still work. Capture the failure and record packet sizes before concluding the application is broken." },
    ],
    code: { lang: "bash", label: "Analyst: path & size checks", text:
`ping -M do -s 1472 203.0.113.80   # DF set, probe MTU
traceroute 203.0.113.80
mtr 203.0.113.80                  # continuous

# 1500 MTU - 20 IP - 20 TCP = 1460 MSS
#   (options / encapsulation reduce this)

# Diagnostic order: define failure -> interface
# -> route/next-hop -> service (not just ping)
# -> policy/NAT/return -> TLS/app errors.` },
    links: ["tcp","routing","ipv6"],
  }),

  C({
    id: "dns", cluster: "transport", title: "DNS & Name Resolution",
    short: "A distributed record system — not a list of websites.",
    body: [
      { h: "Names and addresses are separate", p: "An application can know the name portal.example.test yet still need an IP for the connection. DNS associates names with records (including addresses, mail routing, and service discovery). A stub resolver on the host asks a configured recursive resolver; because the resolver is often off-subnet, the DNS query itself first needs routing and local delivery." },
      { h: "Who finds the answer", p: "A recursive resolver answers from cache or follows the hierarchy: a root server refers toward the relevant top-level-domain servers, which lead toward the authoritative servers for the domain. Each has a different job — the root is not a database of every website. Caching, browser behavior, and connection reuse can remove DNS packets from a trace, so the absence of a query does not prove a hard-coded address." },
      { h: "Read records by their information", list: [
        "A = IPv4 · AAAA = IPv6 · CNAME = another name (resolve the alias) · MX = mail exchanger.",
        "NS = nameserver · PTR = reverse mapping (an assertion, not proof of ownership) · TXT = app/policy text · SRV = service + port.",
        "NXDOMAIN (name does not exist) ≠ SERVFAIL (server could not complete) ≠ timeout (no usable reply).",
        "Transport is UDP and TCP 53 — TCP also handles ordinary queries, not only zone transfers.",
      ]},
      { h: "Protection and abuse", p: "DNSSEC validates signed data (it does not hide the query); DoT (TCP 853) and DoH protect the client-to-resolver channel but a trusted channel to a bad resolver is still bad. A lookup proves a lookup at that point, not a deliberate visit. DNS tunneling hides data in long changing labels; DNS amplification uses spoofed requests and large reflected replies — different mechanisms. Local name resolution (LLMNR, mDNS, NBT-NS) can be abused by an unexpected responder." },
    ],
    code: { lang: "bash", label: "Analyst: query & records", text:
`dig portal.example.test A +trace
dig example.test MX
dig -x 10.20.20.30          # PTR (reverse)

# UDP/TCP 53 · DoT TCP 853 · DoH over HTTPS
# NXDOMAIN != SERVFAIL != timeout

# A long changing-label pattern to one domain,
# from one odd process, is a tunneling lead -
# compare frequency, record type, and baseline.` },
    links: ["web-request","tcp","http-tls","dhcp"],
  }),

  /* ========================= 6 · WEB, MAIL & REMOTE ACCESS ========================= */
  C({
    id: "http-tls", cluster: "webapp", title: "HTTP, HTTPS & TLS",
    short: "What a secure connection does and does not prove.",
    body: [
      { h: "HTTP describes the request", p: "Once a browser has an address and a connection, it still requests a resource. A URL like https://portal.example.test/account carries decisions: the scheme (https), the host (service selection), and the path (/account). Many sites share one IP, so the requested hostname matters to analysis — though encryption may hide it. Methods (GET/POST/PUT/DELETE) describe intent, and status families (2xx success, 3xx redirect, 4xx request problem, 5xx server problem) locate the result — a 200 is an HTTP success, not proof the page is harmless." },
      { h: "Sessions", p: "HTTP is not by itself a persistent identity. Cookies carry state; after login a session cookie identifies server-side state. Secure limits a cookie to secure contexts, HttpOnly restricts script access, SameSite limits cross-site sending — none replaces server-side authorization. A logged-in user still needs permission for the requested resource." },
      { h: "The crypto behind TLS", p: "Encryption protects readability; integrity detects alteration; authentication validates a claimed peer — a private conversation with the wrong server is not secure. A certificate is a signed statement binding identity to a public key; it is not the private key. A CA signature lets the client check that binding against its trust anchors. In a TLS 1.3 handshake the client starts with its expected hostname and parameters, the server contributes key material and presents a certificate while proving possession of the private key, and the client checks the chain, validity, and expected name." },
      { h: "What HTTPS proves — and does not", p: "HTTPS protects HTTP to the authenticated endpoint. A phishing site can hold a valid certificate for its own deceptive domain, so the browser authenticates that domain while the page still steals credentials. TLS does not stop endpoint malware reading data before encryption or after decryption. A passive observer usually sees IPs, timing, and sizes; SNI may be visible unless Encrypted Client Hello protects it, and TLS 1.3 encrypts the certificate message. HTTP/3 runs over QUIC on UDP 443, so filtering TCP 443 alone misses it." },
    ],
    code: { lang: "text", label: "TLS 1.3 handshake (simplified)", text:
`ClientHello  expected name, params, key share
ServerHello  chosen params, key share
   + Certificate  (+ proof of private key)
   + Finished
Client verifies: chain, validity, EXPECTED NAME

# Authentication fails if the cert is for an
# unrelated name - even if a trusted CA signed it.
# The client must know the expected name first.` },
    links: ["dns","tcp","proxies","remote-access"],
  }),

  C({
    id: "proxies", cluster: "webapp", title: "Proxies, Load Balancers & CDNs",
    short: "One apparent action can be several separate connections.",
    body: [
      { h: "Three roles", p: "A forward proxy acts on behalf of clients, often controlling outbound requests. A reverse proxy receives requests on behalf of servers. A load balancer distributes connections or requests among backends, at transport or application level. Each turns one apparent user action into several distinct transport conversations." },
      { h: "Termination changes the picture", p: "When Northstar's browser reaches a reverse proxy in the DMZ, the proxy terminates that connection and opens a separate one to the application server — client-to-proxy and proxy-to-backend are different conversations. If the proxy terminates TLS, encryption ends there; the backend leg needs its own protection if required. The backend may log the proxy as the source." },
      { h: "Forwarded-address headers are claims", p: "A forwarded-address header can preserve an asserted original client address, but it is reliable only when inserted and handled through a trusted proxy path — an arbitrary client can forge a header with the same name. Correlate proxy and backend records instead of treating a header as identity proof." },
      { h: "WAFs and CDNs", p: "A Web Application Firewall evaluates HTTP where it has access to it; it does not protect non-web services or repair missing authorization. A Content Delivery Network places edge services in front of content and can share one IP among many domains — so blocking that IP can affect unrelated sites. Follow the actual participants and termination points to understand both reachability and visibility." },
    ],
    code: { lang: "text", label: "One user action, several conversations", text:
`Client --TLS--> Reverse proxy (DMZ)
                    |  terminates TLS here
                    v
               --TLS?--> Application --> Database

# Backend sees the PROXY as source, unless a
# trusted X-Forwarded-For is set on that path.
# A client can forge X-Forwarded-For - correlate
# proxy + backend logs, don't trust the header.` },
    links: ["http-tls","firewalls","cloud"],
  }),

  C({
    id: "remote-access", cluster: "webapp", title: "SSH, File Transfer & Email",
    short: "Protected channels for administration, transfer, and mail.",
    body: [
      { h: "SSH: two identities", p: "SSH provides a protected channel for remote administration, commonly on TCP 22. The host key lets the client decide it reached the expected server; user authentication (password, public key, other) is a separate step — a changed host-key warning should not be ignored. A successful SSH connection does not imply administrator access. SSH port forwarding can carry other connections through the channel: legitimate access or unauthorized pivoting, where the outer observer sees only SSH while the server reaches an internal service." },
      { h: "File transfer", p: "SFTP is the SSH File Transfer Protocol and is separate from FTP; FTPS is FTP protected with TLS. Plain FTP uses a control connection and a separate data connection, with active and passive modes affecting which side opens the data connection and which ports are needed — inspect the server's configured passive range rather than opening broad ranges from memory. Telnet and plaintext FTP expose content and should be replaced or isolated." },
      { h: "Email transport", p: "SMTP transfers mail (commonly TCP 25 between servers); client submission uses 587 with STARTTLS or 465 with implicit TLS. IMAP synchronizes a mailbox (993 implicit TLS); POP3 retrieves it (995). A port alone does not prove cleartext, since 25 or 587 may use STARTTLS. The visible From header is an author claim; the SMTP envelope supplies routing identities and is not necessarily the same." },
      { h: "Sender authentication", p: "SPF authorizes sending hosts for an envelope domain; DKIM adds a domain-associated signature; DMARC checks whether a passing SPF or DKIM identity aligns with the visible author domain and states a handling preference. A DMARC pass does not prove a message is wanted or benign — an attacker can authenticate a domain they control or misuse a compromised account. For phishing, preserve the original headers and read trusted Authentication-Results and the actual link destinations, not display names." },
    ],
    code: { lang: "text", label: "Protocol & port reference", text:
`SSH / SFTP   TCP 22      host key != user auth
FTP          TCP 21 ctrl + separate data (20)
FTPS         FTP over TLS   Telnet 23 = legacy
SMTP relay   TCP 25      submission 587 / 465
IMAP         143 / 993 TLS   POP3 110 / 995 TLS

# From header   = author claim
# SMTP envelope = routing identity (may differ)
# SPF authorizes · DKIM signs · DMARC aligns` },
    links: ["http-tls","firewalls","vpn"],
  }),

  /* ========================= 7 · IDENTITY & ACCESS CONTROL ========================= */
  C({
    id: "windows-identity", cluster: "access", title: "Windows Enterprise Identity",
    short: "Active Directory, Kerberos, SMB — where identity meets the network.",
    body: [
      { h: "A domain coordinates identity", p: "Active Directory Domain Services provides a centrally managed directory and identity environment, with domain controllers hosting key authentication functions. AD is not one protocol or port — ordinary operation involves DNS, Kerberos, LDAP, SMB, and RPC. Keep three questions separate: discovery asks where the service is, authentication asks which identity is connecting, authorization asks what that identity may do. A user can find a server, authenticate, and still be denied a folder." },
      { h: "SMB turns a file action into traffic", p: "SMB supports file sharing and other Windows interactions, commonly over TCP 445. Accessing a share like \\\\fileserver\\finance means locating the server, establishing the conversation, authenticating, and requesting access — more than a port number. SMB signing protects integrity; SMB encryption protects confidentiality; signing does not hide contents. Investigate the effective settings rather than assuming both are present." },
      { h: "Kerberos uses a central ticket service", p: "A Key Distribution Center (the domain controllers) issues tickets. The client first authenticates and obtains a Ticket Granting Ticket (TGT) intended for the ticket-granting service — not for the file server. To reach a service it presents the TGT to get a service ticket for that service, then presents the service ticket plus an authenticator to the target. The client does not resend its password to every server. The service still performs authorization after authentication." },
      { h: "Other protocols and investigation", p: "LDAP queries directory data (TCP 389 with StartTLS; 636 LDAPS). NTLM is challenge-response — in a relay an attacker forwards an authentication exchange to another service, without reading the password. RPC uses an endpoint mapper (TCP 135) then often a dynamic port; RDP uses 3389; WinRM uses 5985/5986. A new TCP 445 flow alone is weak evidence of lateral movement; a privileged authentication, an executable written to a share, and a remote service created on the target form a stronger sequence when independently supported." },
    ],
    code: { lang: "text", label: "Kerberos: two different recipients", text:
`1  initial auth     -> TGT  (for the KDC)
2  present TGT      -> service ticket
3  present ticket   -> target service
   (+ authenticator)

# The TGT requests tickets; the service ticket
# is for ONE service. The client never re-sends
# its password to every file server.
# Kerberoasting / pass-the-ticket make sense
# only once this ordinary flow is clear.` },
    links: ["firewalls","dns","proxies"],
  }),

  C({
    id: "firewalls", cluster: "access", title: "Firewalls, Segmentation & Zero Trust",
    short: "Policy decides whether a conversation may pass.",
    body: [
      { h: "Describe the conversation before the rule", p: "A firewall evaluates traffic at an enforcement point using addresses, protocol, ports, direction, connection state, and sometimes application or identity. A rule needs concrete endpoints and a purpose — \"allow the application\" is too vague until you know who connects to whom and which service. Employees reaching the app on TCP 443 is a different rule from the app reaching its database on TCP 5432." },
      { h: "Stateful vs stateless", p: "A stateful control tracks permitted conversations so suitable replies are recognized; a stateless control evaluates each packet and needs explicit reverse-direction permission. On the reply, the destination port is the client's ephemeral port, not 443. State expires, so a very late packet may be treated differently. State tracking does not prove the payload is safe." },
      { h: "Order, defaults, and direction", p: "Many firewalls use first-match, so a broad permit above a narrow deny makes the deny ineffective; a default-deny policy rejects traffic without a relevant permit. An ACL is a set of matching rules — the name alone does not establish statefulness or order. Ingress and egress are relative to a boundary (a Cisco wildcard for a /24 is 0.0.0.255). An allowed request can still be blocked by another control or take a return path that misses the stateful device." },
      { h: "Segmentation, least privilege, Zero Trust", p: "Segmentation restricts communication between groups; microsegmentation applies granular policy around workloads; east-west is traffic within an environment, north-south enters or leaves it. A DMZ reduces exposure without guaranteeing containment. Least privilege narrows source, destination, service, identity, and duration — and reviews egress, since an internal host can misuse a broad outbound rule. Zero Trust avoids implicit trust from network location; it is an architecture, not a product." },
    ],
    code: { lang: "text", label: "Intent, not production config", text:
`Employees -> Internal app   TCP 443   permit
App       -> Database        TCP 5432  permit
DMZ proxy -> Internal app    TCP 443   permit
Guests    -> Corporate       any       deny
Internet  -> Database        any       deny

# first-match: a broad permit above a narrow
# deny wins. Cisco wildcard for /24 = 0.0.0.255
# Review EGRESS too, not just inbound.` },
    links: ["vlan","nat","ids","vpn"],
  }),

  C({
    id: "wireless", cluster: "access", title: "Wireless & Network Admission",
    short: "Associating is not the same as being authorized.",
    body: [
      { h: "Wireless basics", p: "An access point connects wireless stations to a network. The SSID is a network name; the BSSID identifies a particular radio interface, and multiple APs can advertise the same SSID. A station associating with an AP is not the same as being authorized to reach corporate resources — link security, user or device authentication, and access policy are separate stages. A familiar SSID is easy to copy and is not proof an AP is legitimate." },
      { h: "Use modern protection", p: "Use WPA2 with AES-based protection or WPA3 per supported policy; treat WEP and older TKIP as obsolete. WPA3-Personal uses SAE and improves resistance to offline password guessing from a captured exchange, but does not make weak passwords or compromised endpoints safe. WPA3 requires Protected Management Frames in its defined modes." },
      { h: "Enterprise 802.1X", p: "Enterprise Wi-Fi uses 802.1X with an EAP method and usually a RADIUS backend (UDP 1812 authentication, 1813 accounting). The roles are the supplicant (endpoint), the authenticator (switch or AP, which relays EAP), and the authentication server (which actually checks the secret). Certificate-based EAP-TLS can authenticate both peers; in password-based methods, validating the authentication server's certificate is critical — if a client accepts any server certificate, a convincing evil twin becomes dangerous." },
      { h: "NAC and threats", p: "Network Access Control can evaluate identity and device condition before assigning access; passing admission is not a permanent guarantee the endpoint stays safe. An evil twin imitates a network to entice clients; a rogue AP is simply unauthorized; deauthentication abuse disrupts connections (PMF protects some management frames but not all interference). Useful evidence includes AP inventories, BSSID observations, association and authentication logs, and certificate-validation errors — ordinary wired capture does not expose over-the-air management frames." },
    ],
    code: { lang: "text", label: "802.1X roles & Wi-Fi security", text:
`supplicant      the endpoint
authenticator   switch / AP (relays EAP)
auth server     RADIUS (UDP 1812 / 1813)

WPA2-AES or WPA3   (WEP, TKIP = obsolete)
WPA3-Personal -> SAE   WPA3 -> requires PMF
EAP-TLS -> mutual cert auth

# Validate the server cert, or an evil twin
# advertising the same SSID can harvest creds.` },
    links: ["firewalls","vpn","windows-identity"],
  }),

  C({
    id: "vpn", cluster: "access", title: "VPNs, Tunnels & Remote Access",
    short: "A tunnel carries one conversation inside another.",
    body: [
      { h: "Tunnels and the three locations", p: "A tunnel transports traffic within another communication; a protected VPN adds security to that path. Site-to-site VPNs connect networks via gateways; remote-access VPNs connect an endpoint to a gateway. Distinguish three points: before the tunnel, on the outer path (an observer commonly sees only the outer endpoints and traffic pattern), and after decapsulation. Encryption may end at the gateway, so internal legs can still need application TLS." },
      { h: "Know the families", p: "IPsec is an architecture for protected IP communication: security associations describe the agreed protection, ESP carries the protected data (IP protocol 50, not a port), and IKE handles key management (UDP 500, with NAT traversal on UDP 4500). Tunnel mode wraps the full inner packet. WireGuard and TLS-based VPNs take other approaches. PPTP is legacy; L2TP alone does not encrypt; the label \"SSL VPN\" does not license obsolete SSL versions." },
      { h: "Full vs split tunnel", p: "A routing choice. Full tunnel directs intended (often all Internet) traffic through the VPN; split tunnel sends selected destinations through it while others use another path. DNS matters: a connected tunnel with the wrong resolver can leave internal IP access working while names fail. Neither label establishes complete protection — inspect actual IPv4 and IPv6 routes, DNS selection, and endpoint policy." },
      { h: "Connected is only one stage", p: "A client can authenticate and build a tunnel yet still lack a route to the target subnet, be denied by a server-side firewall, hit an overlapping home subnet, or suffer MTU problems from encapsulation overhead. Authorization remains separate — a valid remote user may need one application, not the whole server network. For investigation, record account, method, device, session interval, assigned address, and gateway; IP geolocation is approximate and may reflect a carrier or VPN." },
    ],
    code: { lang: "text", label: "IPsec essentials", text:
`IKE        UDP 500   (NAT-T UDP 4500)
ESP        IP protocol 50  (NOT a port)
tunnel mode wraps the full inner packet

outer   198.51.100.10 -> 192.0.2.20   (gateways)
inner   10.20.10.25   -> 10.50.4.12    (protected)

# full vs split tunnel = a routing choice
# 'connected' != reachable (route? policy? MTU?)` },
    links: ["firewalls","routing","remote-access"],
  }),

  /* ========================= 8 · EVIDENCE & MODERN ENVIRONMENTS ========================= */
  C({
    id: "ids", cluster: "evidence", title: "IDS / IPS & Telemetry",
    short: "Detection is a hypothesis; position decides what you can see.",
    body: [
      { h: "Different jobs", p: "A firewall decides whether a conversation is permitted by policy. An Intrusion Detection System observes traffic and reports suspicious patterns. An Intrusion Prevention System applies detection while positioned to block, commonly inline. Products combine these, so identify the enabled role. A signature matches a defined pattern; behavioral analysis compares activity to a model; a false positive flags benign activity and a false negative misses harmful activity. A detection label is a hypothesis supported by evidence, not a verdict." },
      { h: "Position determines visibility", p: "A sensor outside NAT sees translated sources. A sensor only at the Internet edge may never see workstation-to-file-server traffic that stays internal. A tap or mirror must cover the relevant path, and mirrors can drop packets under load. Encryption is another boundary — a passive sensor sees endpoints and timing but not HTTP bodies. Absence of an alert does not establish absence of an attack: ask whether the traffic even crossed the capture point and whether a detection existed." },
      { h: "Choose evidence for the question", list: [
        "Packet capture: headers, timing, readable payload — only for the captured place, time, and bytes.",
        "Flow records (NetFlow/IPFIX): endpoint pairs, ports, duration, volume — a summary, not content, possibly sampled.",
        "DNS, firewall, proxy logs: names/decisions within each source's scope; other paths are invisible to it.",
        "DHCP/NAT logs: address relationships over time (need valid intervals); endpoint and identity logs tie to process and account.",
      ]},
      { h: "Explain why an alert deserves attention", p: "For an alert such as possible command-and-control, record its basis — endpoints, time, protocol, periodicity or signature, visibility — and compare the host's normal destinations. Repeated health checks can resemble beacons; an authorized backup can resemble a large transfer. A defensible statement names both the evidence and the uncertainty, and identifies which additional log would resolve it." },
    ],
    code: { lang: "text", label: "Match evidence to the question", text:
`packet capture    headers/timing/payload (where readable)
flow records      endpoints, ports, volume (no payload)
DNS logs          names, answers, resolver
firewall logs     decisions + connection metadata
proxy logs        requests through the proxy only
DHCP / NAT logs   address<->identity over time
endpoint/identity process, account, resource action

# "2 GB in a flow" != a 2 GB file (overhead,
# retransmits, sampling). No alert != no attack.` },
    links: ["pcap","attacks","nat","telemetry"],
  }),

  C({
    id: "attacks", cluster: "evidence", title: "Network Attacks & Their Evidence",
    short: "Explain the mechanism before naming the attack.",
    body: [
      { h: "Scanning is inference", p: "A port scan tests endpoints to infer which services are reachable. A SYN scan distinguishes responses (SYN-ACK, RST, or none); Nmap's open, closed, and filtered are inferences from one vantage point — open means something accepts that protocol there, closed means reachable but not accepting, filtered means filtering prevents a determination (UDP silence often shows open|filtered). None of these proves vulnerability. A vulnerability assessment asks whether a reachable service has a weakness; exploitation attempts to use it — different stages." },
      { h: "Mechanism → investigation", list: [
        "ARP poisoning → inspect bindings, switch ports, DAI. Rogue DHCP → snooping, approved-server records.",
        "DNS / name-resolution poisoning → resolver control, DNSSEC where appropriate, reduce LLMNR/NBT-NS fallback.",
        "MAC-table exhaustion → port limits and counters. VLAN hopping → explicit access ports, restricted trunks.",
        "SYN flood → half-open pressure, rate controls. Reflection/amplification → source-address validation, exposure control.",
        "Credential interception or relay → protected protocols, identity validation, signing or channel binding.",
        "C2 / tunneling → correlate endpoint, DNS, flow, and application evidence.",
      ]},
      { h: "Positions and floods", p: "Man-in-the-middle describes a position that can observe or modify a conversation; ARP manipulation is one way to obtain it on a local IPv4 network, but correctly validated TLS resists transparent reading even when the attacker forwards packets. DDoS overwhelms a resource — bandwidth, connection state, compute, or an application dependency — and a host firewall cannot recover bandwidth already saturated upstream, so match the response to the bottleneck." },
      { h: "Testable hypotheses", p: "For possible lateral movement, ask whether a workstation began reaching unusual internal admin services, whether the account should use them, and whether a process or resource action supports it. Avoid \"one packet equals one attack\": a defensible conclusion explains the observed sequence, the competing explanations, and the missing evidence — and knows which additional log would resolve the uncertainty." },
    ],
    code: { lang: "text", label: "Mechanism -> investigation step", text:
`ARP poisoning    -> bindings, switch ports, DAI
rogue DHCP       -> snooping, approved servers
DNS manipulation -> resolver control, DNSSEC
SYN flood        -> half-open pressure, rate limit
reflection/ampl. -> source-addr validation
C2 / tunneling   -> endpoint + DNS + flow + app

# open|closed|filtered = inference from ONE
# vantage point, not proof of vulnerability.` },
    links: ["ids","pcap","arp","dhcp"],
  }),

  C({
    id: "pcap", cluster: "evidence", title: "Packet Analysis",
    short: "Start with a question; the capture is an observation, not the network.",
    body: [
      { h: "Start with a question", p: "Analysis is easiest when the question is specific: \"Did the client's SYN reach the server?\" or \"Which resolver answered this name?\" Record the capture location, interface, time range, link type, packet count, snap length, and known drops, and identify whether the vantage point is before NAT, after a proxy, or inside a tunnel. In Wireshark, use Protocol Hierarchy, Endpoints, and Conversations to orient, then narrow to the relevant host pair and follow the stream." },
      { h: "Capture filter vs display filter", p: "A capture filter decides which packets are stored during collection; a display filter hides or shows packets already in the capture. The two languages differ, and once a capture filter excludes a packet a display filter cannot restore it. Filtering to a suspected application too early can hide its cause — an ARP failure happens before the TCP conversation, and an ICMP size error can explain missing TCP data." },
      { h: "Common capture traps", p: "A switched LAN does not deliver everyone's traffic to your port — mirroring, taps, or endpoint capture are different choices, and a mirror can drop packets. Endpoint offload can show packets before checksums complete or after segmentation is aggregated, so apparent bad checksums on outgoing packets can be a capture artifact. A capture started midway lacks setup context, and snap-length truncation removes payload. None of these should be silently read as an attack." },
      { h: "Report honestly", p: "Write the time range and vantage point, relevant endpoints, the observed sequence, the filters used, and the conclusion. Separate \"not observed\" from \"did not occur.\" If only repeated SYNs appear, first establish that the capture point should have seen the replies; a server-side capture can show whether the requests arrived, separating a forward-path problem from a return-path one more effectively than interpreting silence." },
    ],
    code: { lang: "bash", label: "tcpdump + Wireshark display filters", text:
`sudo tcpdump -i eth0 -nn -s 0 -w study.pcap \\
  'host 10.20.10.25 and (tcp port 443 or port 53)'
tcpdump -nn -r study.pcap 'tcp port 443'

# display filters
ip.src==10.20.10.25 and ip.dst==10.20.20.30
tcp.flags.syn==1 and tcp.flags.ack==0   # initial SYN
tcp.flags.reset==1                       # resets
tcp.analysis.retransmission
dns.flags.response==1` },
    links: ["ids","attacks","tcp"],
  }),

  C({
    id: "telemetry", cluster: "evidence", title: "Time, Syslog & SNMP",
    short: "Timestamps order events; log quality decides what you can prove.",
    body: [
      { h: "Time orders everything", p: "NTP synchronizes clocks, commonly over UDP 123. It matters because a one-minute clock error can reverse the apparent order of a login and a connection. Stratum describes distance from a reference in the hierarchy — not a direct measure of accuracy or trust. Record the event timestamp, timezone, ingestion timestamp, and known offset separately; a UTC time such as 2026-10-06T06:14:00Z is the same instant as 2026-10-06T09:14:00+03:00." },
      { h: "Occurrence vs arrival", p: "If an endpoint's clock is two minutes fast, its record may say 09:16 for an event at 09:14 — a clock offset. If a correct 09:14 event reaches the collector at 09:18 because the pipeline queued it, that is ingestion delay. Sorting by arrival can produce a different order from sorting by normalized event time. Preserve original values and document the basis for any correction; do not invent sub-second precision the source never recorded." },
      { h: "Syslog and SNMP", p: "Syslog conveys event records with facility, severity, hostname, and message; severity runs 0 (emergency) to 7 (debug) and is chosen by the emitter, so it is not incident priority. Traditional syslog uses UDP 514; syslog over TLS commonly uses TCP 6514. SNMP monitors and sometimes manages devices (polling UDP 161, notifications UDP 162); older community-based versions lack modern protection, and \"SNMPv3\" does not by itself prove authentication and privacy are both enabled. LLDP advertises neighbor information but is not authentication." },
      { h: "Minimum event quality", p: "Prefer records with a precise timestamp and offset, sensor identity, source and destination endpoints, protocol, action, policy identifier, and relevant account or device identifiers. Keep original records when parsing produces normalized fields, and document collection gaps and retention limits. If a firewall log says \"allowed,\" determine whether it describes a rule decision, a successful establishment, or a session summary — product formats differ." },
    ],
    code: { lang: "text", label: "Timestamps & telemetry ports", text:
`NTP     UDP 123     stratum = distance, not trust
Syslog  UDP 514     TLS -> TCP 6514   sev 0-7
SNMP    poll 161 / notify 162   v3 = auth+priv?

event time  2026-10-06T06:14:00Z
          = 2026-10-06T09:14:00+03:00  (same instant)

# clock offset != ingestion delay - keep both.
# Severity is emitter-chosen, not incident priority.` },
    links: ["ids","pcap"],
  }),

  C({
    id: "cloud", cluster: "evidence", title: "Cloud & Virtual Networking",
    short: "Provider-managed networks still connect listeners through subnets, routes, and controls.",
    body: [
      { h: "Translate the names back to a packet path", p: "Cloud networking still connects listeners through interfaces, subnets, routes, and controls — AWS calls its logical network a VPC, Azure a VNet, and a VM has an interface and IP even when forwarding is provider software. An Internet-facing load balancer, private application servers, and a database tier are several paths with different participants: client-to-listener, load-balancer-to-backend, and application-to-database are distinct conversations, each needing a path, policy, listener, and reply." },
      { h: "Public and private describe routing", p: "In AWS terms a public subnet has a direct route to an Internet gateway — but that alone does not make a VM reachable; it also needs public addressing, a permitted path, a listener, and a return path. A private subnet lacks that route but may reach out through a NAT gateway, so a server can download updates without unsolicited inbound reachability. Private does not mean offline, and public does not mean all ports are open." },
      { h: "Security groups vs network ACLs", p: "An AWS security group is stateful with allow-only rules applied at resource interfaces; a network ACL is stateless with numbered allow and deny rules evaluated first-match at the subnet boundary; an Azure NSG is stateful with prioritized allow and deny rules. These are provider-specific semantics — a security group recognizes replies automatically, a NACL does not, and copying an ephemeral port range from an unrelated example can fail. Both cloud and guest-OS controls can affect delivery." },
      { h: "Isolation, responsibility, containers", p: "A private endpoint gives private-address access to a service, but DNS must select it and the service still needs authorization — a private address is not permission. Shared responsibility identifies which tasks belong to the provider and which configuration, identity, and exposure tasks belong to you; a managed network does not fix an overly broad customer rule. Containers share the host kernel (a VM runs its own); in Kubernetes a Pod shares a network context, a Service is a stable abstraction, and NetworkPolicy restricts traffic additively only where the implementation enforces it." },
    ],
    code: { lang: "text", label: "Security group vs network ACL (AWS)", text:
`Security grp  stateful   allow-only  (at ENI)
Network ACL   stateless  allow+deny  (subnet)
Azure NSG     stateful   prioritized allow/deny

# NACL is first-match at the subnet boundary.
# stateless boundary: the reverse packet goes
#   src 443 -> dst 51532 — allow that way too.
# private != offline · public != all open
# a private DB is still misusable via a
#   compromised app that already has access.` },
    links: ["firewalls","routing","nat","proxies"],
  }),
];

/* Cross-cluster relationship lines — the "chain of decisions" plus key security links.
   Kept deliberately sparse so the map reads as connections, not a hairball. */
const RELATIONS = [
  /* the spine */
  ["web-request","dns"], ["dns","routing"], ["routing","arp"],
  ["arp","mac-switching"], ["mac-switching","vlan"], ["web-request","tcp"],
  ["tcp","http-tls"], ["http-tls","proxies"], ["routing","nat"],
  ["dhcp","dns"], ["ipv4-subnet","routing"], ["ipv6","routing"], ["icmp","tcp"],
  /* security & cross-cluster */
  ["firewalls","vlan"], ["firewalls","nat"], ["ids","pcap"], ["ids","attacks"],
  ["attacks","arp"], ["vpn","firewalls"], ["vpn","routing"], ["wireless","firewalls"],
  ["windows-identity","firewalls"], ["remote-access","http-tls"], ["telemetry","ids"],
  ["cloud","firewalls"], ["cloud","routing"], ["routing-arch","routing"], ["dns","http-tls"],
];

window.KJ = { CATEGORIES, CLUSTERS, CONCEPTS, RELATIONS };
/* Category-shaped export so the engine can host multiple regions. */
window.KJ_NETWORKING = { hub: "Networking", clusters: CLUSTERS, concepts: CONCEPTS, relations: RELATIONS };
