"use server"; // don't forget to add this!

import { actionClient } from "@/lib/safe-action";
import { registerSchema } from "@/schemas/Register-schema";
import { prisma } from "@/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendSMS } from "@/lib/sms";
import { sendEmail } from "@/lib/email";

export const registerUser = actionClient
  .schema(registerSchema)
  .action(
    async ({
      parsedInput: {
        forename,
        surname,
        email,
        mobile,
        password,
        confirmPassword,
        role,
      },
    }) => {
      const emailLower = email.toLowerCase();
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }
      const existingUser = await prisma.user.findFirst({
        where: {
          email: emailLower,
        },
      });

      if (existingUser) {
        return { error: "User already exists" };
      }
      const salt = bcrypt.genSaltSync(10);
      const pwHash = bcrypt.hashSync(password, salt);
      const expires = new Date();
      expires.setHours(expires.getHours() + 6);
      const token = crypto.randomBytes(32).toString("hex");

      await prisma.user.create({
        data: {
          forename,
          surname,
          email: emailLower,
          mobile,
          role,
          password: pwHash,
        },
      });

      await prisma.emailToken.create({
        data: {
          token,
          expires,
          user: {
            connect: {
              email,
            },
          },
        },
      });

      const mobileToken = (
        Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000
      ).toString();
      const mobileExpires = new Date();
      mobileExpires.setHours(mobileExpires.getHours() + 6);

      await prisma.mobileToken.create({
        data: {
          token: mobileToken,
          expires: mobileExpires,
          user: {
            connect: {
              mobile,
            },
          },
        },
      });
      await sendEmail(
        email,
        "welcome@tutacall.com",
        "Verify your email",
        `Visit ${process.env.BASE_URL}/verify-email?token=${token} to verify your email address.`,
        `<a href="${process.env.BASE_URL}/verify-email?token=${token}">Verify your email</a>`
      );

      await sendSMS(
        mobile,
        "Tutacall",
        `Your verification code is: ${mobileToken}. Login and use it within 6 hours.`
      );

      return { success: "Verification Email and SMS sent!" };
    }
  );
