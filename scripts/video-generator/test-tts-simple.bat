@echo off
echo Testing Text-to-Speech...
powershell -ExecutionPolicy Bypass -Command "Add-Type -AssemblyName System.Speech; $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; $synth.Speak('Hello, this is a test of ChemQuest text to speech system. The test is working correctly.'); $synth.Dispose(); Write-Host 'TTS test completed successfully'"
pause