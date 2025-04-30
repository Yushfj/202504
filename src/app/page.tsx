"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image"; // Import Image component

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let angle = 0;

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    function drawMotor() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Outer Stator (fixed)
      ctx.beginPath();
      ctx.strokeStyle = "#3498db"; // light blue
      ctx.lineWidth = 15;
      ctx.arc(centerX, centerY, 120, 0, Math.PI * 2);
      ctx.stroke();

      // Inner Rotor (rotating)
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);
      for (let i = 0; i < 6; i++) {
        ctx.rotate((Math.PI * 2) / 6);
        ctx.beginPath();
        ctx.fillStyle = "#2ecc71"; // green rotor arms
        ctx.fillRect(50, -5, 40, 10); // arm
      }
      ctx.restore();

      // Shaft
      ctx.beginPath();
      ctx.fillStyle = "#f1c40f"; // yellow shaft
      ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
      ctx.fill();

      // Rotation effect
      angle += 0.02;
      requestAnimationFrame(drawMotor);
    }

    drawMotor();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Extended conditional logic for login
    if (
      (username === "ADMIN" && password === "admin01") ||
      (username === "Karishma" && password === "kdevi") ||
      (username === "Renuka" && password === "renu")
    ) {
      router.push("/dashboard");
    } else {
      toast({
        title: "Error",
        description: "Invalid username or password. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative flex items-center justify-center h-screen overflow-hidden">
      {/* Canvas motor animation background */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full -z-10"
      />

      {/* Semi-transparent black overlay */}
      <div className="absolute top-0 left-0 w-full h-full bg-black opacity-50 -z-9" />

      {/* Login Card */}
      <Card className="w-full max-w-md bg-transparent backdrop-blur-md shadow-lg rounded-lg border border-accent/40">
        <CardHeader className="space-y-1 relative text-center">
          {/* Logo */}
          <div className="flex justify-center mb-2">
            <Image
              src="/logo.png" // Path to your logo in the public folder
              alt="Company Logo"
              width={80} // Adjust width as needed
              height={80} // Adjust height as needed
            />
          </div>
          <CardTitle className="text-2xl text-white">
            Lal&apos;s Motor Winders (FIJI) PTE Limited
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="username" className="text-white">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-white/10 text-white placeholder-gray-400 border-white/20" // Added styling for consistency
              />
            </div>
            <div className="grid gap-2 mt-4">
              <Label htmlFor="password" className="text-white">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/10 text-white placeholder-gray-400 border-white/20" // Added styling for consistency
              />
            </div>
            <Button className="w-full mt-6" type="submit" variant="gradient">
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
