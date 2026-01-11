// Strict typing, semicolons mandatory
void greetUser(String name) {
  String message = 'Welcome back, $name!';
  print(message);
}

void main() {
  greetUser("Kolade");
}


import 'package:flutter/material.dart';

class BlueButton extends StatelessWidget {
  final String title;

  // You must explicitly define the constructor
  BlueButton({required this.title});

  @override
  Widget build(BuildContext context) {
    // Instead of HTML tags like <button>, you use Classes
    return Container(
      padding: EdgeInsets.all(10),
      color: Colors.blue,
      child: Text(
        title,
        style: TextStyle(color: Colors.white),
      ),
    );
  }
}