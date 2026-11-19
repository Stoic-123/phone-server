# SSH Remote Access Guide: Windows PC to OPPO Reno2 F

This guide explains how to establish secure SSH shell sessions and mount code from your OPPO Reno2 F Android phone directly onto Windows.

---

## 1. Finding Your Phone's Connection Details

Inside Termux on the phone:
```bash
# 1. Start SSH daemon
sshd

# 2. Check your Termux user ID
whoami
# Output example: u0_a200

# 3. Check your local Wi-Fi IP address
ifconfig
# Look for wlan0 'inet' address, e.g., 192.168.1.50

# 4. Set a password for your user
passwd
# Enter a secure password twice
```

---

## 2. Connecting from Windows PowerShell

Open Windows Terminal or PowerShell and run:
```powershell
ssh -p 8022 u0_a200@192.168.1.50
```
Enter the password you created. You now have an interactive Linux command line on your Android phone!

---

## 3. Passwordless SSH Key Authentication (Recommended)

To avoid typing passwords every time:

### Step 1: Generate an SSH Key on Windows (if you don't already have one)
In PowerShell:
```powershell
ssh-keygen -t ed25519 -C "pocketdev-server"
# Press Enter to accept default location ($env:USERPROFILE\.ssh\id_ed25519)
```

### Step 2: Copy the Public Key to Termux
In PowerShell:
```powershell
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh -p 8022 u0_a200@192.168.1.50 "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

Now you can log in without typing a password:
```powershell
ssh -p 8022 u0_a200@192.168.1.50
```

---

## 4. Connecting with VS Code Remote - SSH

You can edit code, run terminals, and browse phone files directly in VS Code on your Windows PC!

1. In VS Code, install the extension **Remote - SSH** (by Microsoft).
2. Press `Ctrl + Shift + P` and select `Remote-SSH: Open SSH Configuration File...`.
3. Add the following entry:
```ssh-config
Host pocketdev
    HostName 192.168.1.50
    Port 8022
    User u0_a200
    IdentityFile ~/.ssh/id_ed25519
```
4. Press `Ctrl + Shift + P` and select `Remote-SSH: Connect to Host...` > `pocketdev`.
5. Open folder `/data/data/com.termux/files/home/pocketdev/projects`.

You are now editing files directly on your OPPO Reno2 F smartphone as if it were a high-end cloud server!
