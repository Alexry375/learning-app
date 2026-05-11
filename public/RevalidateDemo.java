import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JButton;
import javax.swing.JPanel;
import javax.swing.BoxLayout;
import java.awt.FlowLayout;
import java.awt.BorderLayout;
import java.awt.EventQueue;

public class RevalidateDemo {

    private static int counter = 0;

    public static void main(String[] args) {
        EventQueue.invokeLater(() -> {
            JFrame frame = new JFrame("revalidate vs repaint");
            frame.setLayout(new BorderLayout());

            // Le conteneur dynamique : on va y ajouter des labels à la volée.
            JPanel cible = new JPanel();
            cible.setLayout(new BoxLayout(cible, BoxLayout.Y_AXIS));
            cible.add(new JLabel("Élément initial"));

            // La barre de boutons en bas.
            JPanel barreBoutons = new JPanel(new FlowLayout());

            JButton b1 = new JButton("1. revalidate + repaint (CORRECT)");
            b1.addActionListener(ev -> {
                counter++;
                cible.add(new JLabel("Élément " + counter + " (b1 correct)"));
                cible.revalidate();
                cible.repaint();
            });

            JButton b2 = new JButton("2. repaint seul");
            b2.addActionListener(ev -> {
                counter++;
                cible.add(new JLabel("Élément " + counter + " (b2 repaint seul)"));
                cible.repaint();   // sans revalidate
            });

            JButton b3 = new JButton("3. revalidate seul");
            b3.addActionListener(ev -> {
                counter++;
                cible.add(new JLabel("Élément " + counter + " (b3 revalidate seul)"));
                cible.revalidate();  // sans repaint
            });

            JButton b4 = new JButton("4. rien");
            b4.addActionListener(ev -> {
                counter++;
                cible.add(new JLabel("Élément " + counter + " (b4 rien)"));
                // ni revalidate ni repaint — le composant est ajouté logiquement
                // mais le rendu visuel ne reflète rien.
            });

            JButton bReset = new JButton("Reset");
            bReset.addActionListener(ev -> {
                cible.removeAll();
                counter = 0;
                cible.add(new JLabel("Élément initial"));
                cible.revalidate();
                cible.repaint();
            });

            barreBoutons.add(b1);
            barreBoutons.add(b2);
            barreBoutons.add(b3);
            barreBoutons.add(b4);
            barreBoutons.add(bReset);

            frame.add(cible, BorderLayout.CENTER);
            frame.add(barreBoutons, BorderLayout.SOUTH);

            frame.setSize(700, 400);
            frame.setLocationRelativeTo(null);
            frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
            frame.setVisible(true);
        });
    }
}
