import streamlit as st
import requests

st.set_page_config(page_title="Ethio-Vitality AI", layout="wide")

st.title("Ethio-Vitality AI Dashboard")

# 1. DATA FETCHING UTILS
def fetch_data():
    try:
        return requests.get("http://127.0.0.1:8000/api/v1/sensors/latest").json()
    except:
        return {"heart_rate": 0, "stress_level": 0}

# 2. MAIN DASHBOARD AREA (Passive Coach)
data = fetch_data()
col1, col2 = st.columns(2)
col1.metric("Heart Rate", f"{data.get('heart_rate', 0)} BPM")
col2.metric("Stress Level", f"{data.get('stress_level', 0)}%")

# Proactive Alert Logic
if data.get('stress_level', 0) > 70:
    st.error("⚠️ High stress detected! Please take a moment to breathe or try our suggested wellness tips.")

st.write("---")

# 3. SIDEBAR CHATBOT (Interactive Coach)
st.sidebar.header("AI Wellness Assistant")

if "messages" not in st.session_state:
    st.session_state.messages = []

# Display chat history
for msg in st.session_state.messages:
    with st.sidebar.chat_message(msg["role"]):
        st.markdown(msg["content"])

# User Input
if prompt := st.sidebar.chat_input("Ask me about your health..."):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.sidebar.chat_message("user"):
        st.markdown(prompt)

    # Call backend for AI response
    try:
        response = requests.post("http://127.0.0.1:8000/api/v1/chat", json={"input": prompt})
        bot_reply = response.json().get("reply", "I'm here to help!")
    except:
        bot_reply = "Sorry, I'm having trouble connecting to the coach."

    st.session_state.messages.append({"role": "assistant", "content": bot_reply})
    with st.sidebar.chat_message("assistant"):
        st.markdown(bot_reply)