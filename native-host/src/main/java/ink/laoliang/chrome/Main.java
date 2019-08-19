package ink.laoliang.chrome;

import com.fasterxml.jackson.databind.ObjectMapper;

import javax.swing.*;
import java.io.*;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.MappedByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.channels.FileLock;
import java.nio.charset.StandardCharsets;

public class Main extends JFrame {

    private static Main jFrame;
    private static JTextArea messageShowText;

    private static ObjectMapper mapper = new ObjectMapper();

    public Main() {

        super("Chrome Extensions For Uni Studio");

        // 设置窗体
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(400, 400);
        setVisible(true);

        // 设置窗体布局
        JPanel panel = new JPanel();
        panel.setLayout(new BoxLayout(panel, BoxLayout.Y_AXIS));
        add(panel);

        // 添加文本显示区
        messageShowText = new JTextArea();
        messageShowText.setLineWrap(true);
        panel.add(new JScrollPane(messageShowText));
    }

    public static void main(String[] args) {

        SwingUtilities.invokeLater(() -> jFrame = new Main());

        try {
            // 使用随机空闲的端口、侦听 backlog 和本地回环 IP 地址创建服务器
            ServerSocket serverSocket = new ServerSocket(0, 0, InetAddress.getLoopbackAddress());

            // 建立文件和内存的映射，即时双向同步
            RandomAccessFile raf = new RandomAccessFile("C:\\Users\\lpy\\Desktop\\data.dat", "rw");
            // 获取共享内存和磁盘文件建立联系的文件通道类
            FileChannel fc = raf.getChannel();
            // 获取磁盘文件的内存映射
            MappedByteBuffer mbb = fc.map(FileChannel.MapMode.READ_WRITE, 0, 5);
            // 清除文件内容 ，对 MappedByteBuffer 的操作就是对文件的操作
            for (int i = 0; i < 5; i++) {
                mbb.put(i, (byte) 0);
            }
            // 阻塞独占锁，写入本次启动服务的端口号（当文件锁不可用时，当前进程会被挂起）
            FileLock flock = fc.lock();  // 上锁
            mbb.putInt(serverSocket.getLocalPort());
            flock.release();  // 释放锁

            while (true) {

                // 启动一个 Socket 服务
                Socket server = serverSocket.accept();

                try {

                    DataInputStream in = new DataInputStream(server.getInputStream());  // 服务端输入流
                    DataOutputStream out = new DataOutputStream(server.getOutputStream());  // 服务端输出流

                    while (true) {

                        // 从 RPA 主程序读取请求消息
                        String rpaRequestMsg = in.readUTF();
                        messageShowText.setText("Step11111111111111" + rpaRequestMsg);  // 小程序窗口显示一下

                        // 构建并发送消息到 Chrome 扩展
                        sendMessage(rpaRequestMsg);
                        messageShowText.setText("Step22222222222222" + rpaRequestMsg);  // 小程序窗口显示一下

                        // 从 Chrome 扩展读取响应
                        String chromeResponseMsg = readMessage(System.in);
                        messageShowText.setText("Step33333333333333" + chromeResponseMsg);  // 小程序窗口显示一下
                        MessageObject chromeResponseJson = mapper.readValue(chromeResponseMsg, MessageObject.class);
                        messageShowText.setText("Step44444444444444" + chromeResponseJson.getMessage());  // 小程序窗口显示一下

                        // middleware 响应写回给 RPA 主程序
                        out.writeUTF(chromeResponseJson.getMessage());
                        messageShowText.setText("Step55555555555555" + chromeResponseJson.getMessage());  // 小程序窗口显示一下
                    }

                } catch (IOException e) {
                    e.printStackTrace();
                    // RPA 主程序断开连接，程序进入下一次等待连接状态
                }
            }

        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private static String readMessage(InputStream in) throws IOException {

        byte[] messageLength = new byte[4];
        in.read(messageLength);  // 读取消息大小

        int size = getInt(messageLength);
        if (size == 0) {
            messageShowText.setText("messageLength: " + size);  // 小程序窗口显示一下
            throw new InterruptedIOException("Blocked communication");
        }

        byte[] messageContent = new byte[size];
        in.read(messageContent);

        return new String(messageContent, StandardCharsets.UTF_8);
    }

    private static void sendMessage(String message) throws IOException {
        System.out.write(getBytes(message.length()));
        System.out.write(message.getBytes(StandardCharsets.UTF_8));
        System.out.flush();
    }

    private static int getInt(byte[] bytes) {
        return (bytes[3] << 24) & 0xff000000 |
                (bytes[2] << 16) & 0x00ff0000 |
                (bytes[1] << 8) & 0x0000ff00 |
                (bytes[0]) & 0x000000ff;
    }

    private static byte[] getBytes(int length) {
        byte[] bytes = new byte[4];
        bytes[0] = (byte) (length & 0xFF);
        bytes[1] = (byte) ((length >> 8) & 0xFF);
        bytes[2] = (byte) ((length >> 16) & 0xFF);
        bytes[3] = (byte) ((length >> 24) & 0xFF);
        return bytes;
    }
}
