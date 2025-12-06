#!/bin/bash

# Log Viewer Script for Proxy Server Logs
# Displays formatted, readable logs from proxy-access.log

LOG_FILE="proxy-access.log"

if [[ ! -f "$LOG_FILE" ]]; then
    echo "❌ Log file not found: $LOG_FILE"
    echo "   Make sure the proxy server is running and has received requests"
    exit 1
fi

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to format and display log entry
format_log() {
    local line="$1"
    
    # Extract timestamp
    if [[ $line =~ \[([^\]]+)\] ]]; then
        timestamp="${BASH_REMATCH[1]}"
        echo -e "${CYAN}[$timestamp]${NC}"
    fi
    
    # Extract endpoint (method and full URI with query params)
    if [[ $line =~ ENDPOINT:\ ([A-Z]+)\ ([^\ ]+) ]]; then
        method="${BASH_REMATCH[1]}"
        uri="${BASH_REMATCH[2]}"
        
        # Color code by method and highlight the full endpoint
        case "$method" in
            GET)    echo -e "  ${GREEN}$method${NC} ${CYAN}$uri${NC}" ;;
            POST)   echo -e "  ${YELLOW}$method${NC} ${CYAN}$uri${NC}" ;;
            PUT)   echo -e "  ${BLUE}$method${NC} ${CYAN}$uri${NC}" ;;
            DELETE) echo -e "  ${RED}$method${NC} ${CYAN}$uri${NC}" ;;
            *)      echo -e "  $method ${CYAN}$uri${NC}" ;;
        esac
    # Fallback for old format (REQUEST:)
    elif [[ $line =~ REQUEST:\ ([A-Z]+)\ ([^\ ]+) ]]; then
        method="${BASH_REMATCH[1]}"
        uri="${BASH_REMATCH[2]}"
        case "$method" in
            GET)    echo -e "  ${GREEN}$method${NC} ${CYAN}$uri${NC}" ;;
            POST)   echo -e "  ${YELLOW}$method${NC} ${CYAN}$uri${NC}" ;;
            PUT)   echo -e "  ${BLUE}$method${NC} ${CYAN}$uri${NC}" ;;
            DELETE) echo -e "  ${RED}$method${NC} ${CYAN}$uri${NC}" ;;
            *)      echo -e "  $method ${CYAN}$uri${NC}" ;;
        esac
    fi
    
    # Extract status code
    if [[ $line =~ STATUS:\ ([0-9]+) ]]; then
        status="${BASH_REMATCH[1]}"
        if [[ $status -ge 200 && $status -lt 300 ]]; then
            echo -e "  Status: ${GREEN}$status${NC}"
        elif [[ $status -ge 400 && $status -lt 500 ]]; then
            echo -e "  Status: ${YELLOW}$status${NC}"
        elif [[ $status -ge 500 ]]; then
            echo -e "  Status: ${RED}$status${NC}"
        else
            echo -e "  Status: $status"
        fi
    fi
    
    # Extract response size
    if [[ $line =~ RESPONSE_SIZE:\ ([0-9]+)\ bytes ]]; then
        size="${BASH_REMATCH[1]}"
        echo -e "  Response Size: ${CYAN}$size bytes${NC}"
    fi
    
    # Extract response time
    if [[ $line =~ RESPONSE_TIME:\ ([0-9.]+)\ seconds ]]; then
        time="${BASH_REMATCH[1]}"
        echo -e "  Response Time: ${CYAN}${time}s${NC}"
    fi
    
    # Extract remote address
    if [[ $line =~ REMOTE_ADDR:\ ([^\ ]+) ]]; then
        ip="${BASH_REMATCH[1]}"
        echo -e "  IP: $ip"
    fi
    
    # Extract request body if present (handle multi-line JSON)
    if [[ $line =~ REQUEST_BODY:\ \"(.*)\" ]]; then
        body="${BASH_REMATCH[1]}"
        if [[ -n "$body" && "$body" != "-" && "$body" != "\\\"-\\\"" && "$body" != "[empty body]" ]]; then
            # Unescape newlines and quotes
            body=$(echo "$body" | sed 's/\\n/\n/g' | sed 's/\\"/"/g' | sed 's/\\\\/\\/g')
            # Try to pretty-print if it's JSON
            if echo "$body" | grep -q '^{' || echo "$body" | grep -q '^\['; then
                if command -v jq &> /dev/null; then
                    body=$(echo "$body" | jq . 2>/dev/null || echo "$body")
                fi
            fi
            echo -e "  ${YELLOW}Request Body:${NC}"
            echo -e "  ${YELLOW}$body${NC}"
        elif [[ "$body" == "[empty body]" ]]; then
            echo -e "  ${YELLOW}Request Body: [empty]${NC}"
        fi
    fi
    
    # Extract response body if present
    if [[ $line =~ RESPONSE_BODY:\ \"(.*)\" ]]; then
        resp_body="${BASH_REMATCH[1]}"
        if [[ -n "$resp_body" && "$resp_body" != "-" && "$resp_body" != "\\\"-\\\"" ]]; then
            # Unescape newlines and quotes
            resp_body=$(echo "$resp_body" | sed 's/\\n/\n/g' | sed 's/\\"/"/g' | sed 's/\\\\/\\/g')
            # Try to pretty-print if it's JSON
            if echo "$resp_body" | grep -q '^{' || echo "$resp_body" | grep -q '^\['; then
                if command -v jq &> /dev/null; then
                    resp_body=$(echo "$resp_body" | jq . 2>/dev/null || echo "$resp_body")
                fi
            fi
            # Truncate if too long for display
            if [[ ${#resp_body} -gt 500 ]]; then
                resp_body="${resp_body:0:500}... [truncated]"
            fi
            echo -e "  ${GREEN}Response Body:${NC}"
            echo -e "  ${GREEN}$resp_body${NC}"
        fi
    fi
    
    echo ""
}

# Main function
main() {
    case "${1:-}" in
        -f|--follow)
            echo "📊 Watching logs (Ctrl+C to stop)..."
            echo ""
            tail -f "$LOG_FILE" | while IFS= read -r line; do
                format_log "$line"
            done
            ;;
        -n|--lines)
            lines="${2:-20}"
            echo "📊 Last $lines log entries:"
            echo ""
            tail -n "$lines" "$LOG_FILE" | while IFS= read -r line; do
                format_log "$line"
            done
            ;;
        -s|--search)
            if [[ -z "$2" ]]; then
                echo "Usage: $0 --search <pattern>"
                exit 1
            fi
            echo "📊 Searching for: $2"
            echo ""
            grep "$2" "$LOG_FILE" | while IFS= read -r line; do
                format_log "$line"
            done
            ;;
        -h|--help)
            echo "Proxy Log Viewer"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -f, --follow          Watch logs in real-time"
            echo "  -n, --lines N         Show last N lines (default: 20)"
            echo "  -s, --search PATTERN  Search for pattern in logs"
            echo "  -h, --help           Show this help"
            echo ""
            echo "Examples:"
            echo "  $0                    # Show last 20 entries"
            echo "  $0 -f                 # Watch logs in real-time"
            echo "  $0 -n 50              # Show last 50 entries"
            echo "  $0 -s POST            # Search for POST requests"
            echo "  $0 -s 'STATUS: 404'   # Search for 404 errors"
            exit 0
            ;;
        *)
            echo "📊 Last 20 log entries:"
            echo ""
            tail -n 20 "$LOG_FILE" | while IFS= read -r line; do
                format_log "$line"
            done
            ;;
    esac
}

main "$@"

