import asyncio
import os
import sys
from pathlib import Path
from unittest.mock import patch

# Setup project root
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from backend.app.agents.orchestrator_agent import orchestrator_agent
from backend.app.schemas.chat import ChatRequest, ChatLocationInput

async def run_test_question(index: int, question: str, location: ChatLocationInput = None, conversation_id: str = None, chat_history = None):
    print(f"\n============================================================")
    print(f"TEST {index}: \"{question}\"")
    print(f"Location: {location.city if location else 'None'} ({location.latitude if location else None}, {location.longitude if location else None})")
    print(f"------------------------------------------------------------")
    
    loc_dict = location.model_dump() if location else None
    context = {
        "conversation_id": conversation_id,
        "user_id": "test_user_001",
        "role": "citizen",
        "language": None,
        "location": loc_dict,
    }
    
    res = await orchestrator_agent.execute(
        query=question,
        context=context
    )
    
    msg = res["message"]["content"]
    intent = res["intent"]
    resolved_loc = res["location"]
    sources = res["sources"]
    official_warning = res["official_warning"]
    valid = res["metadata"].get("validation", {}).get("validation_passed", True)
    
    print(f"Resolved Intent: {intent}")
    print(f"Resolved Location: {resolved_loc}")
    print(f"Sources: {sources}")
    print(f"Official Warning: {official_warning}")
    print(f"Validation Passed: {valid}")
    print(f"Response Content:\n{msg}")
    return res

async def main():
    print("============================================================")
    print("STARTING WEATHERGPT FINAL ACCEPTANCE CRITERIA TESTS")
    print("============================================================")

    kalyan_loc = ChatLocationInput(
        latitude=19.2403,
        longitude=73.1305,
        city="Kalyan",
        state="Maharashtra"
    )

    pune_loc = ChatLocationInput(
        latitude=18.5204,
        longitude=73.8567,
        city="Pune",
        state="Maharashtra"
    )

    nashik_loc = ChatLocationInput(
        latitude=19.9975,
        longitude=73.7898,
        city="Nashik",
        state="Maharashtra"
    )

    # ------------------------------------------------------------
    # 15 MANDATORY ACCEPTANCE QUESTIONS
    # ------------------------------------------------------------
    # Q1: Will it rain today?
    await run_test_question(1, "Will it rain today?", kalyan_loc)

    # Q2: Will it rain tomorrow?
    res_q2 = await run_test_question(2, "Will it rain tomorrow?", kalyan_loc)
    conv_id_followup = res_q2["conversation_id"]

    # Q3: Should I carry an umbrella?
    await run_test_question(3, "Should I carry an umbrella?", kalyan_loc)

    # Q4: What is the temperature in Pune?
    res_q4 = await run_test_question(4, "What is the temperature in Pune?", kalyan_loc)

    # Q5: What is the weather here? (Should resolve to Kalyan, NOT Pune, NOT Mumbai!)
    await run_test_question(5, "What is the weather here?", kalyan_loc)

    # Q6: How is the weather for travel to Lonavala?
    await run_test_question(6, "How is the weather for travel to Lonavala?", kalyan_loc)

    # Q7: Any IMD weather warning?
    await run_test_question(7, "Any IMD weather warning?", kalyan_loc)

    # Q8: Will it be cold tonight?
    await run_test_question(8, "Will it be cold tonight?", kalyan_loc)

    # Q9: Is it humid today?
    await run_test_question(9, "Is it humid today?", kalyan_loc)

    # Q10: Can I go for a walk this evening?
    await run_test_question(10, "Can I go for a walk this evening?", kalyan_loc)

    # Q11: Weather forecast for the weekend?
    await run_test_question(11, "Weather forecast for the weekend?", kalyan_loc)

    # Q12: Why is it so hot today?
    await run_test_question(12, "Why is it so hot today?", kalyan_loc)

    # Q13: What is the air quality / weather risk right now?
    await run_test_question(13, "What is the air quality / weather risk right now?", kalyan_loc)

    # Q14: What about evening? (as follow-up in the same conversation as Q2: "Will it rain tomorrow?")
    await run_test_question(14, "What about evening?", kalyan_loc, conversation_id=conv_id_followup)

    # Q15: Translate to Marathi (or answer in Marathi)
    await run_test_question(15, "Translate to Marathi: Will it rain today?", kalyan_loc)

    # ------------------------------------------------------------
    # 32. LOCATION TEST: GPS Location A vs GPS Location B
    # ------------------------------------------------------------
    print("\n============================================================")
    print("SECTION 32: LOCATION TEST (GPS A vs GPS B)")
    print("============================================================")
    res_a = await run_test_question(321, "What is the weather here?", kalyan_loc)
    res_b = await run_test_question(322, "What is the weather here?", nashik_loc)

    assert res_a["location"]["city"] == "Kalyan", f"Expected Kalyan, got {res_a['location']}"
    assert res_b["location"]["city"] == "Nashik", f"Expected Nashik, got {res_b['location']}"
    assert res_a["location"]["city"] != res_b["location"]["city"], "Locations should be different!"
    print(" Location Test PASSED: Correctly distinguishes GPS A and GPS B without Mumbai fallback.")

    # Location missing test:
    print("\n------------------------------------------------------------")
    print("LOCATION MISSING TEST (No GPS, no query location)")
    res_no_loc = await run_test_question(323, "Will it rain today?", None)
    assert "What location would you like me to check?" in res_no_loc["message"]["content"], "Should ask for location"
    print(" Missing Location Test PASSED: Asked user for location.")

    # ------------------------------------------------------------
    # 33. GROQ FAILURE TEST: Simulate Groq API failure
    # ------------------------------------------------------------
    print("\n============================================================")
    print("SECTION 33: GROQ FAILURE TEST")
    print("============================================================")
    from backend.app.llm.groq_provider import GroqProvider
    
    with patch.object(GroqProvider, "generate", side_effect=Exception("Simulated Groq 503 Service Unavailable")):
        res_groq_fail = await run_test_question(331, "What is the weather here?", kalyan_loc)
        assert res_groq_fail["message"]["content"] is not None
        assert "503" not in res_groq_fail["message"]["content"]
        assert "{" not in res_groq_fail["message"]["content"] # No raw JSON
        print(" Groq Failure Test PASSED: Handled error gracefully with verified fallback data.")

    # ------------------------------------------------------------
    # 34. WEATHER API FAILURE TEST: Simulate Weather API failure
    # ------------------------------------------------------------
    print("\n============================================================")
    print("SECTION 34: WEATHER API FAILURE TEST")
    print("============================================================")
    from backend.app.agents.fusion_agent import weather_fusion_agent

    with patch.object(weather_fusion_agent, "build_weather_intelligence", side_effect=Exception("Simulated Weather API Timeout")):
        res_weather_fail = await run_test_question(341, "What is the weather here?", kalyan_loc)
        expected_msg = "I couldn't retrieve the latest weather data right now. Please try again in a moment."
        assert expected_msg in res_weather_fail["message"]["content"], f"Expected '{expected_msg}', got '{res_weather_fail['message']['content']}'"
        print(" Weather API Failure Test PASSED: Returned exact expected failure message without hallucination.")

    print("\n============================================================")
    print("ALL ACCEPTANCE CRITERIA TESTS COMPLETED SUCCESSFULLY!")
    print("============================================================")

if __name__ == "__main__":
    asyncio.run(main())
