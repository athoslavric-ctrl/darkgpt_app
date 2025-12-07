import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

void main() {
  runApp(DarkGPTApp());
}

class DarkGPTApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: Colors.black,
        primaryColor: Colors.greenAccent,
      ),
      home: DarkGPTScreen(),
    );
  }
}

class DarkGPTScreen extends StatefulWidget {
  @override
  State<DarkGPTScreen> createState() => _DarkGPTScreenState();
}

class _DarkGPTScreenState extends State<DarkGPTScreen> {
  final TextEditingController controller = TextEditingController();
  final List<Map<String, String>> messages = [];
  bool isLoading = false;

  Future<void> sendMessage(String message) async {
    if (message.trim().isEmpty) return;

    setState(() {
      messages.add({"role": "user", "content": message});
      isLoading = true;
    });

    controller.clear();

    // 🟩 GROQ API URL
    final url = Uri.parse("https://api.groq.com/openai/v1/chat/completions");

    final response = await http.post(
      url,
      headers: {
        "Content-Type": "application/json",

        // 🔥 CHEIA TA GROQ — SAFE
        "Authorization": "Bearer APY_KEY_HERE",
      },
      body: json.encode({
        "model": "llama-3.1-8b-versatile",
        "messages": [
          {"role": "user", "content": message}
        ],
        "temperature": 0.7
      }),
    );

    if (response.statusCode == 200) {
      final jsonBody = json.decode(response.body);
      final reply = jsonBody["choices"][0]["message"]["content"];

      setState(() {
        messages.add({"role": "assistant", "content": reply});
        isLoading = false;
      });
    } else {
      setState(() {
        messages.add({
          "role": "assistant",
          "content": "⚠️ Eroare API:\n${response.body}"
        });
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 0,
        title: Text(
          "DΛRK-GPT // MATRIX-EDITION",
          style: TextStyle(
            color: Colors.greenAccent,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.8,
            fontSize: 18,
          ),
        ),
        centerTitle: true,
      ),

      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: EdgeInsets.all(12),
              itemCount: messages.length + (isLoading ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == messages.length && isLoading) {
                  return _loadingBubble();
                }

                final msg = messages[index];
                final isUser = msg["role"] == "user";

                return Align(
                  alignment:
                      isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: EdgeInsets.symmetric(vertical: 6),
                    padding: EdgeInsets.all(14),
                    constraints: BoxConstraints(maxWidth: 280),
                    decoration: BoxDecoration(
                      color: isUser
                          ? Colors.greenAccent.withOpacity(0.15)
                          : Colors.black.withOpacity(0.6),
                      border: Border.all(
                        color: Colors.greenAccent,
                        width: 1.2,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.greenAccent.withOpacity(0.4),
                          blurRadius: 6,
                          spreadRadius: 1,
                          offset: Offset(0, 0),
                        )
                      ],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      msg["content"]!,
                      style: TextStyle(
                        color: Colors.greenAccent,
                        fontFamily: "Courier New",
                        fontSize: 14,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          _inputField(),
        ],
      ),
    );
  }

  // LOADING bubble
  Widget _loadingBubble() {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        padding: EdgeInsets.all(14),
        margin: EdgeInsets.symmetric(vertical: 6),
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.6),
          border: Border.all(color: Colors.greenAccent, width: 1.2),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          "▮ Decrypting response...",
          style: TextStyle(
            color: Colors.greenAccent,
            fontFamily: "Courier New",
          ),
        ),
      ),
    );
  }

  // INPUT FIELD
  Widget _inputField() {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      decoration: BoxDecoration(
        border: Border(top: BorderSide(color: Colors.greenAccent, width: 1)),
        color: Colors.black,
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: controller,
              style: TextStyle(color: Colors.greenAccent),
              cursorColor: Colors.greenAccent,
              decoration: InputDecoration(
                hintText: "root@DarkGPT: ~ enter command...",
                hintStyle: TextStyle(
                  color: Colors.greenAccent.withOpacity(0.4),
                  fontFamily: "Courier New",
                ),
                filled: true,
                fillColor: Colors.black,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.greenAccent),
                ),
                enabledBorder: OutlineInputBorder(
                  borderSide: BorderSide(color: Colors.greenAccent),
                ),
                focusedBorder: OutlineInputBorder(
                  borderSide: BorderSide(color: Colors.greenAccent, width: 2),
                ),
              ),
            ),
          ),
          SizedBox(width: 10),
          GestureDetector(
            onTap: () => sendMessage(controller.text),
            child: Container(
              padding: EdgeInsets.all(14),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.greenAccent,
                boxShadow: [
                  BoxShadow(
                    color: Colors.greenAccent.withOpacity(0.7),
                    blurRadius: 8,
                    spreadRadius: 3,
                  )
                ],
              ),
              child: Icon(Icons.send, color: Colors.black),
            ),
          )
        ],
      ),
    );
  }
}
