import { useState } from "react";
import { Input, Button, Typography } from "@material-tailwind/react";
// import { login } from "../api/login";
import type { LoginData } from "../types/auth";
import $api from "../../../api/axios";

export default function LoginForm() {
  const [formData, setFormData] = useState<LoginData>({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await $api.post("/login", formData);
    console.log(result);
    // await login(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-sm mx-auto mt-10 space-y-6 bg-white p-6 rounded-lg shadow-lg border border-blue-gray-200"
    >
      <Typography
        variant="h4"
        as="h4"
        className="text-blue-gray-800 text-center mb-6"
        placeholder={undefined}
        onResize={undefined}
        onResizeCapture={undefined}
        onPointerEnterCapture={undefined}
        onPointerLeaveCapture={undefined}
      >
        Вход
      </Typography>
      <div>
        <Input
          label="Email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="text-blue-gray-900"
          onResize={undefined}
          onResizeCapture={undefined}
          onPointerEnterCapture={undefined}
          onPointerLeaveCapture={undefined}
          crossOrigin={undefined}
        />
      </div>
      <div>
        <Input
          type="password"
          label="Пароль"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className="text-blue-gray-900"
          onResize={undefined}
          onResizeCapture={undefined}
          onPointerEnterCapture={undefined}
          onPointerLeaveCapture={undefined}
          crossOrigin={undefined}
        />
      </div>
      <Button
        type="submit"
        fullWidth
        color="blue-gray"
        className="mt-4"
        placeholder={undefined}
        onResize={undefined}
        onResizeCapture={undefined}
        onPointerEnterCapture={undefined}
        onPointerLeaveCapture={undefined}
      >
        Войти
      </Button>
    </form>
  );
}
