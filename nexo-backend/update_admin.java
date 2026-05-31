import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
public class update_admin {
    public static void main(String[] args) {
        String hash = new BCryptPasswordEncoder().encode("admin123");
        System.out.println("UPDATE users SET password_hash = '" + hash + "' WHERE email = 'admin@udistrital.edu.co';");
    }
}
