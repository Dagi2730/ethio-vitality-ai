import streamlit as st
import requests

st.set_page_config(page_title="Ethio-Vitality AI", layout="wide")

st.title("Ethio-Vitality AI Dashboard")

# 1. DATA FETCHING UTILS
def fetch_data():
    try:
        # Note: Ensure backend is running and reachable
        response = requests.get("import.meta.env.VITE_API_URL", timeout=5)
        return response.json()
    except Exception:
        return {"heart_rate": 0, "stress_level": 0}

# 2. MAIN DASHBOARD AREA
data = fetch_data()
col1, col2 = st.columns(2)
col1.metric("Heart Rate", f"{data.get('heart_rate', 0)} BPM")
col2.metric("Stress Level", f"{data.get('stress_level', 0)}%")

if data.get('stress_level', 0) > 70:
    st.error("⚠️ High stress detected! Please take a moment to breathe or try our suggested wellness tips.")

st.write("---")

# 3. SIDEBAR CHATBOT
st.sidebar.header("AI Wellness Assistant")

# Initialize history
if "messages" not in st.session_state:
    st.session_state.messages = []

# Display ALL history first (so it persists on every rerun)
for msg in st.session_state.messages:
    with st.sidebar.chat_message(msg["role"]):
        st.markdown(msg["content"])

# Handle User Input
if prompt := st.sidebar.chat_input("Ask me about your health..."):
    # A. Show User Message
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.sidebar.chat_message("user"):
        st.markdown(prompt)

    # B. Get and Show Assistant Response
    with st.sidebar.chat_message("assistant"):
        message_placeholder = st.empty() # Placeholder for streaming/loading feel
        message_placeholder.markdown("Thinking...")
        
        try:
            payload = {"input": prompt, "lang": "am"}
            response = requests.post("import.meta.env.VITE_API_URL", json=payload, timeout=15)
            response.raise_for_status()
            bot_reply = response.json().get("reply", "No response content received.")
        except Exception as e:
            bot_reply = f"Error communicating with AI: {str(e)}"
        
        # Update UI and Session State
        message_placeholder.markdown(bot_reply)
        st.session_state.messages.append({"role": "assistant", "content": bot_reply})